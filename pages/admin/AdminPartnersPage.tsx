import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Star, Image as ImageIcon } from 'lucide-react';
import { partnerRepository } from '@/repositories/featureRepositories';
import type { Partner, PartnerType } from '@/types/platform';
import { Badge, Button, SearchInput, PageHeader, Card, Modal, Input, Select } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';

const TYPE_LABELS: Record<PartnerType, string> = {
  platform: 'Платформа', advertising: 'Реклама', career: 'Карьера',
  media: 'Медиа', education: 'Образование', other: 'Другое',
};

export function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', websiteUrl: '', type: 'career' as PartnerType, description: '', logoUrl: '', sortOrder: '0' });
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

  const load = async () => {
    const ps = await partnerRepository.getAll();
    setPartners(ps);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = partners.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newPartner.name || !newPartner.websiteUrl) return;
    await partnerRepository.create({
      name: newPartner.name,
      websiteUrl: newPartner.websiteUrl,
      type: newPartner.type,
      description: newPartner.description || undefined,
      logoUrl: newPartner.logoUrl || undefined,
      isActive: true,
      sortOrder: parseInt(newPartner.sortOrder) || 0,
    });
    setShowCreate(false);
    setNewPartner({ name: '', websiteUrl: '', type: 'career', description: '', logoUrl: '', sortOrder: '0' });
    load();
  };

  const toggleActive = async (p: Partner) => {
    await partnerRepository.update({ ...p, isActive: !p.isActive });
    load();
  };

  const remove = async (id: string) => {
    await partnerRepository.remove(id);
    load();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <PageHeader
          title="Партнёры"
          subtitle="Управление партнёрами платформы"
          actions={<Button icon={<Plus size={18} />} onClick={() => setShowCreate(true)}>Добавить</Button>}
        />

          <div style={{ marginBottom: 20 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию..." />
          </div>

          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Star size={32} />} title="Нет партнёров" description="Добавьте первого партнёра" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((p) => (
                <Card key={p.id} style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {p.logoUrl ? <img src={p.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={20} style={{ color: 'var(--muted)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name} <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>#{p.sortOrder}</span></div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{p.description || '—'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <Badge color="blue">{TYPE_LABELS[p.type]}</Badge>
                      <Badge color={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Активен' : 'Скрыт'}</Badge>
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ExternalLink size={12} /> {p.websiteUrl}
                      </a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditPartner(p)}>Изменить</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>{p.isActive ? 'Скрыть' : 'Показать'}</Button>
                    <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 8 }} title="Удалить"><Trash2 size={16} /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новый партнёр">
            <Input label="Название" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} placeholder="СтудКарьера" />
            <Input label="Ссылка" value={newPartner.websiteUrl} onChange={(e) => setNewPartner({ ...newPartner, websiteUrl: e.target.value })} placeholder="https://vk.ru/..." />
            <Select label="Тип" value={newPartner.type} onChange={(e) => setNewPartner({ ...newPartner, type: e.target.value as PartnerType })}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input label="Описание (необязательно)" value={newPartner.description} onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })} />
            <Input label="Логотип URL (необязательно)" value={newPartner.logoUrl} onChange={(e) => setNewPartner({ ...newPartner, logoUrl: e.target.value })} placeholder="/assets/..." />
            <Input label="Порядок сортировки" type="number" value={newPartner.sortOrder} onChange={(e) => setNewPartner({ ...newPartner, sortOrder: e.target.value })} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Отмена</Button>
              <Button onClick={handleCreate} disabled={!newPartner.name || !newPartner.websiteUrl}>Добавить</Button>
            </div>
          </Modal>

          {editPartner && (
            <Modal open={!!editPartner} onClose={() => setEditPartner(null)} title="Редактировать партнёра">
              <Input label="Название" value={editPartner.name} onChange={(e) => setEditPartner({ ...editPartner, name: e.target.value })} />
              <Input label="Ссылка" value={editPartner.websiteUrl} onChange={(e) => setEditPartner({ ...editPartner, websiteUrl: e.target.value })} />
              <Input label="Логотип URL" value={editPartner.logoUrl || ''} onChange={(e) => setEditPartner({ ...editPartner, logoUrl: e.target.value })} placeholder="/assets/..." />
              <Input label="Порядок сортировки" type="number" value={String(editPartner.sortOrder)} onChange={(e) => setEditPartner({ ...editPartner, sortOrder: parseInt(e.target.value) || 0 })} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <Button variant="ghost" onClick={() => setEditPartner(null)}>Отмена</Button>
                <Button onClick={async () => { if (editPartner) { await partnerRepository.update(editPartner); setEditPartner(null); load(); } }}>Сохранить</Button>
              </div>
            </Modal>
          )}
      </div>
    </div>
  );
}
