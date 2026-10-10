import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getCacheKey(bik: string): string {
  return `bank:${bik}`;
}

async function getCached(supabase: ReturnType<typeof createClient>, bik: string): Promise<unknown | null> {
  const key = getCacheKey(bik);
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
  bik: string,
  value: unknown,
  ttlMs: number,
): Promise<void> {
  const key = getCacheKey(bik);
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
    const bik = String(body?.bik ?? "").trim();

    if (!bik || !/^\d{9}$/.test(bik)) {
      return new Response(
        JSON.stringify({ error: "БИК должен содержать 9 цифр" }),
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

    // Check cache (7 days)
    const cached = await getCached(supabase, bik);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call DaData Bank API
    const dadataRes = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({ query: bik }),
      },
    );

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
        JSON.stringify({ error: "Банк не найден. Проверьте БИК или заполните вручную." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = {
      bankName: suggestion.name?.payment ?? suggestion.name?.full ?? "",
      bik: suggestion.bik ?? bik,
      correspondentAccount: suggestion.correspondent_account ?? "",
      status: suggestion.state?.status ?? null,
    };

    // Save to cache (7 days)
    await setCached(supabase, bik, result, 7 * 24 * 60 * 60 * 1000);

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
