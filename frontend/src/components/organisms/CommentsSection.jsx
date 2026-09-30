import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import useApi from '../../hooks/useApi.js'
import { createComment, listComments } from '../../services/commentService.js'
import Avatar from '../atoms/Avatar.jsx'
import Button from '../atoms/Button.jsx'
import Input from '../atoms/Input.jsx'
import Spinner from '../atoms/Spinner.jsx'
import CommentItem from '../molecules/CommentItem.jsx'

export default function CommentsSection({ videoId }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const { data, loading, error: loadError, mutate } = useApi(() => listComments(videoId), videoId)
  const comments = data ?? []
  const [postError, setPostError] = useState('')
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setPostError('')
    try {
      const created = await createComment(videoId, text.trim())
      mutate((prev) => [created, ...prev])
      setText('')
      setFocused(false)
    } catch (err) {
      setPostError(err.message)
    } finally {
      setSending(false)
    }
  }

  const cancel = () => {
    setText('')
    setFocused(false)
  }

  return (
    <section className="mt-6 px-4 sm:px-0" aria-labelledby="comments-title">
      <h2 id="comments-title" className="text-xl font-bold text-fg">
        {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
      </h2>

      {isAuthenticated ? (
        <form onSubmit={submit} className="mt-5 flex gap-3">
          <Avatar name={user.name} size={40} />
          <div className="flex-1">
            <Input
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Agrega un comentario…"
              aria-label="Agregar un comentario"
              className="rounded-none border-0 border-b bg-transparent px-0 focus:ring-0"
            />
            {focused && (
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={cancel}>
                  Cancelar
                </Button>
                <Button type="submit" icon="send" loading={sending} disabled={!text.trim()}>
                  Comentar
                </Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-surface p-3 text-sm text-fg">
          <Link to="/auth" state={{ from: location.pathname }} className="font-medium text-brand hover:underline">
            Inicia sesión
          </Link>{' '}
          para dejar un comentario.
        </p>
      )}

      {(postError || loadError) && (
        <p role="alert" className="mt-3 text-sm text-brand">
          {postError || loadError.message}
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </section>
  )
}
