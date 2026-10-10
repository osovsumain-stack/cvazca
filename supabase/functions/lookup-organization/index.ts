import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getCacheKey(inn: string): string {
  return `organization:${inn}`;
}

async function getCached(supabase: ReturnType<typeof createClient>, inn: string): Promise<unknown | null> {
  const key = getCacheKey(inn);
  const { data } = await supabase
    .from("dadata_cache")
    .select("value, expires_at")
    .eq("key", key)
    .maybeSingle();
  if (data && new Date(data.expires_at).getTime() > Date.now()) {
    return data.value;
  }
  return null;
}

async function setCached(
  supabase: ReturnType<typeof createClient>,
  inn: string,
  value: unknown,
  ttlMs: number,
): Promise<void> {
  const key = getCacheKey(inn);
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  await supabase.from("dadata_cache").upsert({ key, value, expires_at: expiresAt });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const query = String(body?.inn ?? "").trim();

    if (!query || !/^\d{10,15}$/.test(query)) {
      return new Response(
        JSON.stringify({ error: "ИНН должен содержать 10–15 цифр" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("DADATA_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Сервис автозаполнения недоступен" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Сервис автозаполнения недоступен" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache (24h TTL)
    const cached = await getCached(supabase, query);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call DaData
    const dadataRes = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({ query, branch_type: "MAIN" }),
      },
    );

    if (dadataRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов к сервису. Попробуйте позже или заполните вручную." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (dadataRes.status === 403) {
      return new Response(
        JSON.stringify({ error: "Нет доступа к сервису автозаполнения. Заполните вручную." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!dadataRes.ok) {
      return new Response(
        JSON.stringify({ error: "Сервис временно недоступен. Заполните вручную." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dadataData = await dadataRes.json();
    const suggestion = dadataData?.suggestions?.[0]?.data;

    if (!suggestion) {
      return new Response(
        JSON.stringify({ error: "Организация не найдена. Проверьте ИНН или заполните вручную." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = {
      entityType: suggestion.type === "INDIVIDUAL" ? "INDIVIDUAL" : "LEGAL",
      inn: suggestion.inn ?? "",
      kpp: suggestion.kpp ?? "",
      ogrn: suggestion.ogrn ?? "",
      ogrnip: suggestion.ogrn ?? "",
      fullName: suggestion.name?.full_with_opf ?? "",
      shortName: suggestion.name?.short_with_opf ?? "",
      legalAddress:
        suggestion.address?.data?.source ??
        suggestion.address?.unrestricted_value ??
        suggestion.address?.value ??
        "",
      signatoryFullName: suggestion.management?.name ?? "",
      signatoryPosition: suggestion.management?.post ?? "",
      okved: suggestion.okved ?? "",
      organizationStatus: suggestion.state?.status ?? null,
      branchType: suggestion.branch_type ?? "MAIN",
    };

    // Save to cache (24h)
    await setCached(supabase, query, result, 24 * 60 * 60 * 1000);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Внутренняя ошибка. Заполните вручную." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
