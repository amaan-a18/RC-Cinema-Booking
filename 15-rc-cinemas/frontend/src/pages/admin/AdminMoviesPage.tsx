import { useState, type FormEvent } from "react";
import { useCreateMovie, useDeleteMovie, useMovies, useUpdateMovie } from "@/api/hooks";
import { extractErrorMessage } from "@/api/client";
import type { Movie } from "@/api/types";
import { Button } from "@/components/common/Button";
import { Card, Spinner } from "@/components/common/Card";

const inputClass =
  "rounded-sm border border-ink/20 bg-bg px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";

const emptyMovieForm = {
  title: "",
  synopsis: "",
  genre: "",
  language: "",
  duration_minutes: 120,
  cert: "UA",
  trailer_youtube_id: "",
  poster_url: "",
};

function extractYoutubeId(value: string): string {
  const match = value.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : value.trim();
}

export function AdminMoviesPage() {
  const { data: movies, isLoading } = useMovies();
  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyMovieForm);
  const [error, setError] = useState<string | null>(null);

  function startEdit(movie: Movie) {
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      synopsis: movie.synopsis,
      genre: movie.genre,
      language: movie.language,
      duration_minutes: movie.duration_minutes,
      cert: movie.cert,
      trailer_youtube_id: movie.trailer_youtube_id,
      poster_url: movie.poster_url,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyMovieForm);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId !== null) {
        await updateMovie.mutateAsync({ id: editingId, ...form });
        cancelEdit();
      } else {
        await createMovie.mutateAsync(form);
        setForm(emptyMovieForm);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this movie? Its shows will be removed too.")) return;
    try {
      await deleteMovie.mutateAsync(id);
      if (editingId === id) cancelEdit();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  const saving = createMovie.isPending || updateMovie.isPending;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Movies</h1>
      <p className="mt-1 text-sm text-ink-soft">Add, edit, and remove titles playing at RC Cinemas.</p>

      {isLoading ? (
        <div className="flex justify-center py-8 text-ink-soft">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5 text-ink-soft">
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Title</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Language</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Duration</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">Trailer</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {(movies ?? []).map((m) => (
                <tr key={m.id} className="border-b border-ink/5">
                  <td className="px-3 py-2">{m.title}</td>
                  <td className="px-3 py-2">{m.language}</td>
                  <td className="px-3 py-2">{m.duration_minutes} min</td>
                  <td className="px-3 py-2">
                    {m.trailer_youtube_id ? (
                      <a
                        className="text-gold hover:underline"
                        href={`https://youtube.com/watch?v=${m.trailer_youtube_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.trailer_youtube_id}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(m)} className="mr-3 text-gold hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          {editingId !== null ? "Edit movie" : "Add movie"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            placeholder="Cert (e.g. UA)"
            value={form.cert}
            onChange={(e) => setForm((f) => ({ ...f, cert: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Genre"
            value={form.genre}
            onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Language"
            value={form.language}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            min={1}
            placeholder="Duration (min)"
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
            className={inputClass}
          />
          <input
            required
            placeholder="YouTube trailer ID or URL (e.g. dQw4w9WgXcQ)"
            value={form.trailer_youtube_id}
            onChange={(e) => setForm((f) => ({ ...f, trailer_youtube_id: extractYoutubeId(e.target.value) }))}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            placeholder="Poster image URL"
            value={form.poster_url}
            onChange={(e) => setForm((f) => ({ ...f, poster_url: e.target.value }))}
            className={inputClass}
          />
          <textarea
            placeholder="Synopsis"
            value={form.synopsis}
            onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
            className={`${inputClass} sm:col-span-3`}
          />
          {error && <p className="text-xs text-red-400 sm:col-span-3">{error}</p>}
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" disabled={saving}>
              {editingId !== null ? "Save changes" : "Add movie"}
            </Button>
            {editingId !== null && (
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
