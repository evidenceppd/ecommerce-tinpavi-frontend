import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  BookOpen,
  Bold,
  CalendarDays,
  Copy,
  FileText,
  ImagePlus,
  GripVertical,
  Heading2,
  Italic,
  List,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { noticiasService, type Noticia, type NoticiaInput } from '../../services/noticias.service'
import { uploadService } from '../../services/upload.service'
import { resolveImageUrl } from '../../services/api'
import OptimizedImage from '../../components/shared/OptimizedImage'
import { Select } from '../../components/shared/Select'

type View = 'list' | 'form'
type ContentBlockType = 'text' | 'image' | 'tip'

interface ContentBlock {
  id: string
  type: ContentBlockType
  title?: string
  text?: string
  image?: string
  lineHeight?: string
}

interface BlogArticle extends Noticia {
  slug?: string
  dicaTecnica?: string
  imagemConteudo?: string
  relacionados?: string[]
  blocks?: ContentBlock[]
}

const categoryOptions = ['Sinalizacao viaria', 'Normas e Legislacao', 'Produtos', 'Aplicacoes', 'Dicas e Boas Praticas']

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function imageSrc(value?: string) {
  if (!value) return ''
  if (value.startsWith('data:')) return value
  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) return resolveImageUrl(value)
  if (value.startsWith('/')) return value
  return resolveImageUrl(value)
}

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function formatCardSummary(value: string, maxLines = 3, maxChars = 160) {
  const normalized = value.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''

  let summary = normalized
  let truncated = false

  const lines = summary.split('\n')
  if (lines.length > maxLines) {
    summary = lines.slice(0, maxLines).join('\n').trimEnd()
    truncated = true
  }

  if (summary.length > maxChars) {
    const slice = summary.slice(0, maxChars)
    const lastBoundary = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
    summary = (lastBoundary > maxChars * 0.6 ? slice.slice(0, lastBoundary) : slice).trimEnd()
    truncated = true
  }

  return truncated ? `${summary.replace(/[.\s]+$/g, '')}...` : summary
}

function normalizeMarker(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function articleFromNoticia(item: Noticia): BlogArticle {
  const blocks = blocksFromArticle({ materia: item.materia, dicaTecnica: '', imagemConteudo: '' })
  const article = {
    ...item,
    topicos: item.topicos ?? [],
    dicaTecnica: blocks.find((block) => block.type === 'tip')?.text ?? '',
    imagemConteudo: blocks.find((block) => block.type === 'image')?.image ?? '',
    relacionados: [],
    blocks,
  }
  return article
}

function makeBlock(type: ContentBlockType): ContentBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    text: '',
    lineHeight: type === 'text' ? '1.75' : undefined,
  }
}

function blocksFromArticle(article: Pick<BlogArticle, 'materia' | 'dicaTecnica' | 'imagemConteudo'>): ContentBlock[] {
  const parsedBlocks = article.materia
    .split(/\n\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map<ContentBlock | null>((segment, index) => {
      const [firstLine = '', ...restLines] = segment.split('\n')
      const marker = normalizeMarker(firstLine)
      const body = restLines.join('\n').trim()

      if (marker === 'dica tecnica') {
        return body ? { id: `tip-${index}`, type: 'tip' as const, text: body } : null
      }

      if (marker === 'imagem') {
        return body ? { id: `image-${index}`, type: 'image' as const, image: body } : null
      }

      return {
        id: `text-${index}`,
        type: 'text' as const,
        title: restLines.length > 0 ? firstLine : undefined,
        text: restLines.length > 0 ? restLines.join('\n') : segment,
        lineHeight: '1.75',
      }
    })
    .filter((block): block is ContentBlock => block !== null)

  const hasTipBlock = parsedBlocks.some((block) => block.type === 'tip')
  const hasImageBlock = parsedBlocks.some((block) => block.type === 'image')

  const fallbackBlocks: ContentBlock[] = []
  if (!hasTipBlock && article.dicaTecnica?.trim()) {
    fallbackBlocks.push({ id: 'tip-legacy', type: 'tip', text: article.dicaTecnica.trim() })
  }
  if (!hasImageBlock && article.imagemConteudo?.trim()) {
    fallbackBlocks.push({ id: 'image-legacy', type: 'image', image: article.imagemConteudo.trim() })
  }

  return [...parsedBlocks, ...fallbackBlocks]
}

function serializeBlocks(blocks: ContentBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'text') return [block.title?.trim(), block.text?.trim()].filter(Boolean).join('\n')
      if (block.type === 'tip') {
        const tipText = block.text?.trim()
        return tipText ? `Dica tecnica\n${tipText}` : ''
      }
      const imageValue = block.image?.trim()
      return imageValue ? `Imagem\n${imageValue}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function blockMeta(type: ContentBlockType) {
  if (type === 'image') {
    return {
      label: 'Imagem',
      description: 'Foto, banner ou ilustracao no corpo do artigo',
      icon: ImagePlus,
      badge: 'bg-blue-50 text-blue-700',
      border: 'border-blue-100',
    }
  }

  if (type === 'tip') {
    return {
      label: 'Dica',
      description: 'Bloco de destaque amarelo para orientacao rapida',
      icon: BookOpen,
      badge: 'bg-[#f5c518]/20 text-[#8a6a00]',
      border: 'border-[#f5c518]/30',
    }
  }

  return {
    label: 'Texto',
    description: 'Titulo opcional e paragrafo de conteudo',
    icon: FileText,
    badge: 'bg-slate-100 text-slate-700',
    border: 'border-slate-200',
  }
}

function RichTextPreview({ value, lineHeight = '1.75' }: { value?: string; lineHeight?: string }) {
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)

    return parts.map((part, index) => {
      if (part.startsWith('***') && part.endsWith('***')) {
        return <strong key={`${part}-${index}`}><em>{part.slice(3, -3)}</em></strong>
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
      }
      return <span key={`${part}-${index}`}>{part}</span>
    })
  }

  const lines = (value ?? '').split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (!listItems.length) return
    elements.push(
      <ul key={`list-${elements.length}`} className="my-3 list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
      return
    }

    flushList()
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={index} className="mt-4 text-lg font-bold text-slate-950">{renderInline(trimmed.slice(3))}</h3>)
      return
    }

    elements.push(<p key={index}>{renderInline(trimmed)}</p>)
  })
  flushList()

  return <div className="space-y-2 whitespace-normal break-words text-sm text-slate-700 [overflow-wrap:anywhere]" style={{ lineHeight }}>{elements}</div>
}

function TextBlockEditor({
  value,
  lineHeight,
  onChange,
  onLineHeightChange,
}: {
  value: string
  lineHeight: string
  onChange: (value: string) => void
  onLineHeightChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const insertAround = (before: string, after = before, fallback = 'texto') => {
    const textarea = ref.current
    if (!textarea) {
      onChange(`${value}${before}${fallback}${after}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end) || fallback
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const insertLinePrefix = (prefix: string, fallback: string) => {
    const textarea = ref.current
    const insertion = `${prefix}${fallback}`
    if (!textarea) {
      onChange(value ? `${value}\n${insertion}` : insertion)
      return
    }

    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart) || fallback}`
    onChange(next)
    requestAnimationFrame(() => textarea.focus())
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#f5c518] focus-within:ring-2 focus-within:ring-[#f5c518]/20">
      <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50 p-2">
        <button type="button" onClick={() => insertLinePrefix('## ', 'Subtitulo')} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer">
          <Heading2 size={14} /> Titulo
        </button>
        <button type="button" onClick={() => insertAround('**', '**', 'negrito')} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer">
          <Bold size={14} /> Negrito
        </button>
        <button type="button" onClick={() => insertAround('*', '*', 'italico')} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer">
          <Italic size={14} /> Italico
        </button>
        <button type="button" onClick={() => insertAround('***', '***', 'negrito e italico')} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer">
          <Bold size={14} />
          <Italic size={14} />
        </button>
        <button type="button" onClick={() => insertLinePrefix('- ', 'Item da lista')} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer">
          <List size={14} /> Lista
        </button>
        <label className="ml-auto inline-flex h-8 items-center gap-2 rounded-md bg-white px-2 text-xs font-bold text-slate-600">
          Linha
          <select
            value={lineHeight}
            onChange={(event) => onLineHeightChange(event.target.value)}
            className="border-0 bg-transparent text-xs font-bold outline-none cursor-pointer"
          >
            <option value="1.4">1.4</option>
            <option value="1.6">1.6</option>
            <option value="1.75">1.75</option>
            <option value="2">2.0</option>
          </select>
        </label>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder="Escreva o texto do bloco. Use a barra acima para formatar."
        className="w-full resize-y border-0 bg-white px-3 py-2 text-sm outline-none"
        style={{ lineHeight }}
      />
    </div>
  )
}

function ArticleCard({ article, onEdit, onDelete }: { article: BlogArticle; onEdit: () => void; onDelete: () => void }) {
  const isProductImage = article.imagemCapa?.includes('/assets/maisVendidos/') || article.imagemCapa?.includes('/assets/categorias/')
  const summary = formatCardSummary(article.descricao || '')

  return (
    <article className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[#f5c518]/60">
      <div className="h-44 overflow-hidden bg-slate-100">
        {article.imagemCapa ? (
          <OptimizedImage
            src={imageSrc(article.imagemCapa)}
            alt={article.titulo}
            containerClassName="relative h-full w-full overflow-hidden"
            className={`block h-full w-full ${isProductImage ? 'object-contain p-4' : 'object-cover'}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus size={34} /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded bg-[#f5c518] px-2 py-1 text-[10px] font-bold uppercase text-slate-950">{article.categoria || 'Sem categoria'}</span>
          <span className="text-xs font-semibold text-slate-400">{formatDate(article.createdAt)}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950 ">{article.titulo}</h3>
        <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-xs leading-5 text-slate-500">{summary}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <BookOpen size={13} />
            {article.tempoLeitura || '5 min'}
          </span>
          <div className="flex items-center gap-2">
              <button type="button" onClick={onEdit} className="rounded-lg bg-[#f5c518]/15 p-1.5 text-[#8a6a00] hover:bg-[#f5c518]/25 cursor-pointer">
              <Pencil size={14} />
            </button>
            <button type="button" onClick={onDelete} className="rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function DeleteArticleModal({
  articleTitle,
  deleting,
  visible,
  onConfirm,
  onCancel,
}: {
  articleTitle: string
  deleting: boolean
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm transition-all duration-200 ease-out ${
        visible ? 'bg-slate-950/50 opacity-100' : 'bg-slate-950/0 opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-article-title"
        className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl transition-all duration-200 ease-out ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <h3 id="delete-article-title" className="text-base font-bold text-slate-950">Excluir artigo</h3>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-500">
          Tem certeza que deseja excluir <span className="font-semibold text-slate-800">"{articleTitle}"</span>? Esta acao nao pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BlogPreview({ article }: { article: BlogArticle }) {
  const topics = article.topicos ?? []
  const blocks = article.blocks?.length ? article.blocks : blocksFromArticle(article)
  const heroImage = article.imagemBanner || article.imagemCapa

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 p-6">
        <div className="mb-5">
          <p className="mb-5 text-sm font-bold text-slate-600">← Voltar para o blog</p>
          <span className="rounded bg-[#f5c518] px-2 py-1 text-[10px] font-bold uppercase text-slate-950">{article.categoria || 'Categoria'}</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
          <h1 className="max-w-3xl break-words text-4xl font-bold leading-tight text-slate-950 [overflow-wrap:anywhere]">{article.titulo || 'Titulo do artigo'}</h1>
          <p className="mt-4 max-w-2xl whitespace-pre-line break-words text-base leading-7 text-slate-600 [overflow-wrap:anywhere]">{article.descricao || 'Resumo do artigo.'}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(article.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{article.tempoLeitura || '5 min'} de leitura</span>
            <span className="inline-flex items-center gap-1.5"><Tag size={14} />{article.categoria || 'Blog'}</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-slate-200">
          {heroImage ? <OptimizedImage src={imageSrc(heroImage)} alt="" containerClassName="h-56 md:h-72 lg:h-64" className="h-full w-full object-cover" /> : null}
        </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-lg border border-slate-200 p-6">
          {blocks.map((block) => {
            if (block.type === 'tip') {
              return (
                <div key={block.id} className="mb-6 rounded-lg bg-[#f5c518] p-4 text-slate-950 last:mb-0">
                  <p className="font-bold">Dica tecnica</p>
                  <p className="mt-1 break-words text-sm leading-6 [overflow-wrap:anywhere]">{block.text}</p>
                </div>
              )
            }

            if (block.type === 'image') {
              return block.image ? (
                <OptimizedImage
                  key={block.id}
                  src={imageSrc(block.image)}
                  alt=""
                  containerClassName="relative mb-6 overflow-hidden rounded-lg last:mb-0"
                  className="aspect-[16/7] w-full object-cover"
                />
              ) : null
            }

            return (
              <div key={block.id} className="mb-6 last:mb-0">
                {block.title ? <h2 className="mb-3 break-words text-xl font-bold text-slate-950 [overflow-wrap:anywhere]">{block.title}</h2> : null}
                <RichTextPreview value={block.text} lineHeight={block.lineHeight ?? '1.75'} />
              </div>
            )
          })}
        </div>

        <aside className="space-y-4">
          {topics.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-slate-950">Neste artigo</h3>
              <div className="mt-3 space-y-2">
                {topics.map((topic) => <p key={topic} className="break-words text-sm font-bold text-slate-600 [overflow-wrap:anywhere]">{topic}</p>)}
              </div>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-bold text-slate-950">Compartilhar</h3>
            <button type="button" className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f5c518] text-sm font-bold text-slate-950">
              <Copy size={15} /> Copiar link
            </button>
          </div>
          <div className="rounded-lg bg-slate-950 p-4 text-white">
            <h3 className="font-bold">Precisa de orientacao?</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">Fale com um especialista para escolher os produtos certos para sua aplicacao.</p>
            <button type="button" className="mt-4 h-10 w-full rounded-lg bg-[#f5c518] text-sm font-bold text-slate-950">Falar com especialista</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BlogForm({ article, onCancel, onSave }: { article: BlogArticle | null; onCancel: () => void; onSave: (article: BlogArticle, files: { capa: File | null; banner: File | null; content: File | null }) => Promise<void> }) {
  const [draft, setDraft] = useState<BlogArticle>(() => {
    if (!article) {
      return {
        id: `blog-${Date.now()}`,
        titulo: '',
        descricao: '',
        materia: '',
        categoria: 'Sinalizacao viaria',
        imagemCapa: '',
        imagemBanner: '',
        imagemBannerMobile: '',
        tempoLeitura: '5 min',
        createdAt: new Date().toISOString(),
        publicado: true,
        topicos: [],
        dicaTecnica: '',
        imagemConteudo: '',
        relacionados: [],
        blocks: [],
      }
    }
    // Ensure blocks are always populated, even when article comes without blocks
    const blocks = article.blocks?.length ? article.blocks : blocksFromArticle(article)
    return { ...article, blocks }
  })
  const [files, setFiles] = useState({ capa: null as File | null, banner: null as File | null, content: null as File | null })
  const [topicosRaw, setTopicosRaw] = useState(() => (draft.topicos ?? []).join('\n'))
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const capaRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof BlogArticle>(key: K, value: BlogArticle[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const updateBlocks = (blocks: ContentBlock[]) => {
    setDraft((current) => ({
      ...current,
      blocks,
      materia: serializeBlocks(blocks),
      dicaTecnica: blocks.find((block) => block.type === 'tip')?.text ?? '',
      imagemConteudo: blocks.find((block) => block.type === 'image')?.image ?? '',
    }))
  }

  const updateBlock = (id: string, patch: Partial<ContentBlock>) => {
    updateBlocks((draft.blocks ?? []).map((block) => block.id === id ? { ...block, ...patch } : block))
  }

  const moveBlock = (id: string, direction: -1 | 1) => {
    const blocks = [...(draft.blocks ?? [])]
    const index = blocks.findIndex((block) => block.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return
    const [block] = blocks.splice(index, 1)
    blocks.splice(nextIndex, 0, block)
    updateBlocks(blocks)
  }

  const reorderBlocks = (fromId: string, toId: string) => {
    if (fromId === toId) return
    const blocks = [...(draft.blocks ?? [])]
    const fromIndex = blocks.findIndex((block) => block.id === fromId)
    const toIndex = blocks.findIndex((block) => block.id === toId)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = blocks.splice(fromIndex, 1)
    blocks.splice(toIndex, 0, moved)
    updateBlocks(blocks)
  }

  const removeBlock = (id: string) => {
    updateBlocks((draft.blocks ?? []).filter((block) => block.id !== id))
  }

  const addBlock = (type: ContentBlockType) => {
    updateBlocks([...(draft.blocks ?? []), makeBlock(type)])
  }

  const handleImage = (key: 'imagemCapa' | 'imagemBanner' | 'imagemConteudo', fileKey: keyof typeof files, file?: File) => {
    if (!file) return
    setFiles((current) => ({ ...current, [fileKey]: file }))
    const reader = new FileReader()
    reader.onload = () => update(key, reader.result as BlogArticle[typeof key])
    reader.readAsDataURL(file)
  }

  const previewArticle = { ...draft, topicos: splitLines(topicosRaw) }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (draft.titulo.trim().length < 4) return toast.error('Informe um titulo para o artigo')
    if (draft.descricao.trim().length < 10) return toast.error('Informe um resumo com pelo menos 10 caracteres')
    const blocks = draft.blocks ?? []
    if (blocks.length === 0) return toast.error('Adicione pelo menos um bloco ao artigo')
    if (!blocks.some((block) => block.type !== 'image' && block.text?.trim())) return toast.error('Adicione pelo menos um bloco de texto ou dica')
    await onSave({ ...draft, materia: serializeBlocks(blocks), topicos: splitLines(topicosRaw) }, files)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 cursor-pointer"><ArrowLeft size={18} /></button>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Conteudo tecnico</p>
          <h2 className="text-2xl font-bold text-slate-950">{article ? 'Editar artigo' : 'Criar artigo'}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,780px)_1fr]">
        <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Categoria</span>
              <Select
                value={draft.categoria}
                onChange={(value) => update('categoria', value)}
                options={categoryOptions.map((c) => ({ value: c, label: c }))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Tempo de leitura</span>
              <input value={draft.tempoLeitura} onChange={(event) => update('tempoLeitura', event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-sm font-bold text-slate-700">Titulo</span>
            <input value={draft.titulo} onChange={(event) => update('titulo', event.target.value)} placeholder="Ex: Como usar cones de sinalizacao corretamente" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-sm font-bold text-slate-700">Resumo</span>
            <textarea value={draft.descricao} onChange={(event) => update('descricao', event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input ref={capaRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImage('imagemCapa', 'capa', event.target.files?.[0])} />
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImage('imagemBanner', 'banner', event.target.files?.[0])} />
            <input ref={contentRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImage('imagemConteudo', 'content', event.target.files?.[0])} />
            {([
              { label: 'Imagem do card', hint: '800 × 500 px', value: draft.imagemCapa, onClick: () => capaRef.current?.click() },
              { label: 'Hero do artigo', hint: '900 × 500 px', value: draft.imagemBanner, onClick: () => bannerRef.current?.click() },
            ] as { label: string; hint?: string; value: string; onClick: () => void }[]).map((item) => (
              <button key={item.label} type="button" onClick={item.onClick} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left cursor-pointer hover:border-[#f5c518]">
                <div className="aspect-[16/10]">
                  {item.value ? <OptimizedImage src={imageSrc(item.value)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus /></div>}
                </div>
                <div className="flex flex-col p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Upload size={14} />{item.label}</div>
                  {item.hint && <span className="mt-0.5 text-xs text-slate-400">{item.hint}</span>}
                </div>
              </button>
            ))}
          </div>

          <label className="space-y-1.5 block">
            <span className="text-sm font-bold text-slate-700">Topicos do bloco "Neste artigo"</span>
            <textarea value={topicosRaw} onChange={(event) => setTopicosRaw(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
          </label>

          <section className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-950">Construtor do artigo</h3>
                <p className="text-xs text-slate-500">Adicione blocos e organize a ordem em que eles aparecem na pagina.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['text', 'image', 'tip'] as ContentBlockType[]).map((type) => {
                  const meta = blockMeta(type)
                  const Icon = meta.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#f5c518] hover:bg-[#f5c518]/5 cursor-pointer"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-slate-950">{meta.label}</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">{meta.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Blocos do artigo</h3>
                <p className="text-xs text-slate-500">{draft.blocks?.length ?? 0} bloco(s) no artigo.</p>
              </div>
            </div>

            <div className="space-y-3">
              {(draft.blocks ?? []).map((block, index) => {
                const meta = blockMeta(block.type)
                const Icon = meta.icon
                return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', block.id)
                    setDraggingBlockId(block.id)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    setDragOverBlockId(block.id)
                  }}
                  onDragLeave={() => setDragOverBlockId((current) => current === block.id ? null : current)}
                  onDrop={(event) => {
                    event.preventDefault()
                    const fromId = event.dataTransfer.getData('text/plain') || draggingBlockId
                    if (fromId) reorderBlocks(fromId, block.id)
                    setDraggingBlockId(null)
                    setDragOverBlockId(null)
                  }}
                  onDragEnd={() => {
                    setDraggingBlockId(null)
                    setDragOverBlockId(null)
                  }}
                  className={`rounded-xl border bg-white p-3 shadow-sm transition ${
                    draggingBlockId === block.id ? 'scale-[0.99] opacity-50' : ''
                  } ${
                    dragOverBlockId === block.id && draggingBlockId !== block.id ? 'border-[#f5c518] ring-2 ring-[#f5c518]/25' : meta.border
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span title="Arraste para reordenar" className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase text-slate-950">{index + 1}. {meta.label}</p>
                        <p className="truncate text-xs text-slate-500">{meta.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" title="Mover para cima" onClick={() => moveBlock(block.id, -1)} disabled={index === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer">
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" title="Mover para baixo" onClick={() => moveBlock(block.id, 1)} disabled={index === (draft.blocks?.length ?? 0) - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer">
                        <ArrowDown size={14} />
                      </button>
                      <button type="button" title="Remover bloco" onClick={() => removeBlock(block.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {block.type === 'text' ? (
                    <div className="space-y-2">
                      <input value={block.title ?? ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Titulo do bloco (opcional)" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
                      <TextBlockEditor
                        value={block.text ?? ''}
                        lineHeight={block.lineHeight ?? '1.75'}
                        onChange={(value) => updateBlock(block.id, { text: value })}
                        onLineHeightChange={(value) => updateBlock(block.id, { lineHeight: value })}
                      />
                    </div>
                  ) : null}

                  {block.type === 'tip' ? (
                    <textarea value={block.text ?? ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} rows={3} placeholder="Dica tecnica" className="w-full rounded-lg border border-[#f5c518]/40 bg-[#f5c518]/10 px-3 py-2 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
                  ) : null}

                  {block.type === 'image' ? (
                    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                      <input
                        id={`${block.id}-image`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          try {
                            const result = await uploadService.uploadImage(file, 'blogs', { maxWidth: 1200, maxHeight: 480 })
                            updateBlock(block.id, { image: result.url })
                          } catch {
                            toast.error('Falha ao enviar imagem')
                          }
                        }}
                      />
                      <div className="h-28 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {block.image ? (
                          <OptimizedImage src={imageSrc(block.image)} alt="" containerClassName="relative h-full w-full overflow-hidden" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus /></div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input value={block.image ?? ''} onChange={(event) => updateBlock(block.id, { image: event.target.value })} placeholder="/assets/banner-hometp.png ou URL da imagem" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
                        <div className="flex items-center gap-3">
                          <label htmlFor={`${block.id}-image`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#f5c518]/15 px-3 text-xs font-bold text-[#8a6a00] hover:bg-[#f5c518]/25 cursor-pointer">
                            <Upload size={14} /> Enviar imagem
                          </label>
                          <span className="text-xs text-slate-400">Recomendado: 1200 × 480 px</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )})}
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancelar</button>
            <button type="submit" className="h-10 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 hover:bg-[#e0b20f] cursor-pointer">Salvar artigo</button>
          </div>
        </form>

        <div className="min-w-0">
          <BlogPreview article={previewArticle} />
        </div>
      </div>
    </div>
  )
}

export default function Noticias() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [editing, setEditing] = useState<BlogArticle | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [deletingArticle, setDeletingArticle] = useState<BlogArticle | null>(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteModalTimerRef = useRef<number | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await noticiasService.getAll()
      setArticles(data.map(articleFromNoticia))
    } catch (error) {
      console.error('Falha ao carregar artigos no admin', error)
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 401 || status === 403) {
        toast.error('Sessao expirada. Faca login novamente.')
      } else {
        toast.error('Nao foi possivel carregar os artigos.')
      }
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    return () => {
      if (deleteModalTimerRef.current !== null) {
        window.clearTimeout(deleteModalTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!deletingArticle) {
      setDeleteModalVisible(false)
      return
    }

    if (deleteModalTimerRef.current !== null) {
      window.clearTimeout(deleteModalTimerRef.current)
      deleteModalTimerRef.current = null
    }

    const frame = window.requestAnimationFrame(() => setDeleteModalVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [deletingArticle])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return articles.filter((article) => {
      const categoryMatch = category === 'Todos' || article.categoria === category
      const queryMatch = !query || [article.titulo, article.descricao, article.categoria].join(' ').toLowerCase().includes(query)
      return categoryMatch && queryMatch
    })
  }, [articles, category, search])

  const saveArticle = async (article: BlogArticle, files: { capa: File | null; banner: File | null; content: File | null }) => {
    const [capaUrl, bannerUrl] = await Promise.all([
      files.capa ? uploadService.uploadImage(files.capa, 'blogs', { maxWidth: 800, maxHeight: 500 }).then((result) => result.url) : Promise.resolve(undefined),
      files.banner ? uploadService.uploadImage(files.banner, 'blogs', { maxWidth: 900, maxHeight: 500 }).then((result) => result.url) : Promise.resolve(undefined),
      files.content ? uploadService.uploadImage(files.content, 'blogs', { maxWidth: 900, maxHeight: 500 }).then((result) => result.url) : Promise.resolve(undefined),
    ])

    const nextArticle = {
      ...article,
      imagemCapa: capaUrl ?? article.imagemCapa,
      imagemBanner: bannerUrl ?? article.imagemBanner,
    }

    const payload: NoticiaInput = {
      categoria: nextArticle.categoria,
      titulo: nextArticle.titulo,
      descricao: nextArticle.descricao,
      materia: nextArticle.materia,
      publicado: nextArticle.publicado,
      imagemCapa: nextArticle.imagemCapa,
      imagemBanner: nextArticle.imagemBanner,
      imagemBannerMobile: nextArticle.imagemBannerMobile,
      tempoLeitura: nextArticle.tempoLeitura,
      topicos: nextArticle.topicos ?? [],
    }

    try {
      if (editing) {
        await noticiasService.update(editing.id, payload)
        setArticles((current) => current.map((item) => item.id === editing.id ? nextArticle : item))
      } else {
        const created = await noticiasService.create(payload)
        setArticles((current) => [{ ...nextArticle, id: created.id, createdAt: created.createdAt }, ...current])
      }
      setView('list')
      setEditing(null)
      toast.success('Artigo salvo')
    } catch {
      setArticles((current) => editing ? current.map((item) => item.id === editing.id ? nextArticle : item) : [nextArticle, ...current])
      setView('list')
      setEditing(null)
      toast.success('Artigo salvo localmente')
    }
  }

  const confirmDeleteArticle = async () => {
    if (!deletingArticle) return

    try {
      setDeleting(true)
      await noticiasService.delete(deletingArticle.id)
      setArticles((current) => current.filter((item) => item.id !== deletingArticle.id))
      setDeleteModalVisible(false)
      deleteModalTimerRef.current = window.setTimeout(() => {
        setDeletingArticle(null)
        deleteModalTimerRef.current = null
      }, 200)
      toast.success('Artigo removido')
    } catch {
      toast.error('Nao foi possivel remover o artigo')
    } finally {
      setDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteModalVisible(false)
    deleteModalTimerRef.current = window.setTimeout(() => {
      setDeletingArticle(null)
      deleteModalTimerRef.current = null
    }, 200)
  }

  if (view === 'form') {
    return <BlogForm article={editing} onCancel={() => { setView('list'); setEditing(null) }} onSave={saveArticle} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Conteudo</p>
          <h2 className="text-2xl font-bold text-slate-950">Blog tecnico</h2>
          <p className="text-sm text-slate-500">Gerencie artigos, categorias, capas e conteudos de orientacao exibidos na loja.</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setView('form') }} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 hover:bg-[#e0b20f] cursor-pointer">
          <Plus size={17} /> Novo artigo
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar artigos por titulo, resumo ou categoria" className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20">
            <option value="Todos">Todas as categorias</option>
            {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Artigos</p><p className="mt-1 text-2xl font-bold text-slate-950">{articles.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Categorias</p><p className="mt-1 text-2xl font-bold text-slate-950">{new Set(articles.map((item) => item.categoria)).size}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Publicados</p><p className="mt-1 text-2xl font-bold text-emerald-700">{articles.filter((item) => item.publicado).length}</p></div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">Carregando artigos...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">Nenhum artigo encontrado</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={() => { setEditing(article); setView('form'); window.scrollTo(0, 0) }}
              onDelete={() => {
                if (deleteModalTimerRef.current !== null) {
                  window.clearTimeout(deleteModalTimerRef.current)
                  deleteModalTimerRef.current = null
                }
                setDeletingArticle(article)
              }}
            />
          ))}
        </div>
      )}

      {deletingArticle ? (
        <DeleteArticleModal
          articleTitle={deletingArticle.titulo}
          deleting={deleting}
          visible={deleteModalVisible}
          onCancel={closeDeleteModal}
          onConfirm={() => void confirmDeleteArticle()}
        />
      ) : null}
    </div>
  )
}
