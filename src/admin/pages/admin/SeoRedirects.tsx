import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { seoRedirectService, type SeoRedirect } from '../../services/seoRedirect.service'

export default function SeoRedirects() {
  const [items, setItems] = useState<SeoRedirect[]>([])
  const [form, setForm] = useState({ fromPath: '', toPath: '', isActive: true })

  const load = async () => {
    try {
      const response = await seoRedirectService.list({ page: 1, limit: 50 })
      setItems(response.items)
    } catch {
      toast.error('Falha ao carregar redirects')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await seoRedirectService.create(form)
      toast.success('Redirect criado')
      setForm({ fromPath: '', toPath: '', isActive: true })
      await load()
    } catch {
      toast.error('Erro ao criar redirect')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await seoRedirectService.remove(id)
      toast.success('Redirect removido')
      await load()
    } catch {
      toast.error('Erro ao remover redirect')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">SEO Redirects</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <input value={form.fromPath} onChange={(e) => setForm((prev) => ({ ...prev, fromPath: e.target.value }))} required placeholder="/origem" className="border border-gray-200 rounded-lg px-3 py-2" />
        <input value={form.toPath} onChange={(e) => setForm((prev) => ({ ...prev, toPath: e.target.value }))} required placeholder="/destino" className="border border-gray-200 rounded-lg px-3 py-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Ativo</label>
        <button type="submit" className="bg-[#f5c518] text-[#111] font-semibold rounded-lg px-4 py-2 cursor-pointer">Adicionar</button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Origem</th>
              <th className="py-2">Destino</th>
              <th className="py-2">Ativo</th>
              <th className="py-2">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.fromPath}</td>
                <td className="py-2">{item.toPath}</td>
                <td className="py-2">{item.isActive ? 'Sim' : 'Nao'}</td>
                <td className="py-2">
                  <button onClick={() => void handleDelete(item.id)} className="text-red-600 cursor-pointer">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

