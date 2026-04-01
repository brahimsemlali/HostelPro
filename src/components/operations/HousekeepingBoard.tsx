"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  PlayCircle,
  Eye,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus, deleteTask, createHousekeepingTask } from "@/lib/actions/operations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils/dates";
import type { HousekeepingTask, Room } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  checkout_clean: "Nettoyage départ",
  daily_clean: "Nettoyage quotidien",
  deep_clean: "Grand nettoyage",
  turndown: "Couverture",
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Basse", className: "bg-stone-100 text-stone-500" },
  normal: { label: "Normale", className: "bg-blue-100 text-blue-700" },
  high: { label: "Haute", className: "bg-amber-100 text-amber-700" },
  urgent: { label: "Urgente", className: "bg-red-100 text-red-700" },
  critical: { label: "Critique", className: "bg-red-200 text-red-800" },
};

const STATUS_COLUMNS = [
  { value: "pending", label: "À faire", icon: Clock, color: "border-stone-200 bg-stone-50" },
  { value: "in_progress", label: "En cours", icon: PlayCircle, color: "border-amber-200 bg-amber-50" },
  { value: "completed", label: "Terminé", icon: CheckCircle2, color: "border-emerald-200 bg-emerald-50" },
  { value: "inspected", label: "Inspecté", icon: Eye, color: "border-blue-200 bg-blue-50" },
];

type TaskWithRoom = Partial<HousekeepingTask> & { room?: Partial<Room>; id: string };

type HousekeepingBoardProps = {
  tasks: TaskWithRoom[];
  rooms: Partial<Room>[];
};

export function HousekeepingBoard({ tasks, rooms }: HousekeepingBoardProps) {
  const router = useRouter();
  const [showAddTask, setShowAddTask] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const tasksByStatus = STATUS_COLUMNS.reduce<Record<string, TaskWithRoom[]>>((acc, col) => {
    acc[col.value] = tasks.filter((t) => t.status === col.value);
    return acc;
  }, {});

  async function handleStatusChange(
    id: string,
    newStatus: "pending" | "in_progress" | "completed" | "inspected"
  ) {
    setLoadingId(id);
    try {
      await updateTaskStatus(id, newStatus);
      toast.success("Statut mis à jour");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    setLoadingId(id);
    try {
      await deleteTask(id);
      toast.success("Tâche supprimée");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingId(null);
    }
  }

  const pendingCount = tasksByStatus["pending"]?.length || 0;
  const inProgressCount = tasksByStatus["in_progress"]?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-stone-500">
            {pendingCount} tâche{pendingCount !== 1 ? "s" : ""} en attente
            {inProgressCount > 0 ? ` · ${inProgressCount} en cours` : ""}
          </p>
        </div>
        <Button onClick={() => setShowAddTask(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus size={15} className="mr-2" /> Nouvelle tâche
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUS_COLUMNS.map((col) => {
          const count = tasksByStatus[col.value]?.length || 0;
          return (
            <div key={col.value} className="hp-card p-4 text-center">
              <p className="text-2xl font-heading font-bold text-stone-900">{count}</p>
              <p className="text-xs text-stone-500 mt-0.5">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      {tasks.length === 0 ? (
        <div className="hp-card p-12 text-center">
          <ClipboardList size={48} className="text-stone-200 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-stone-700 mb-2">Aucune tâche</h3>
          <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
            Les tâches de nettoyage sont créées automatiquement lors d&apos;un check-out, ou manuellement ici.
          </p>
          <Button onClick={() => setShowAddTask(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus size={15} className="mr-2" /> Créer une tâche
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Kanban */}
          <div className="hidden lg:grid grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.value] || [];
              return (
                <div key={col.value} className={`rounded-2xl border-2 ${col.color} p-3 min-h-[400px]`}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <col.icon size={16} className="text-stone-500" />
                    <p className="text-sm font-semibold text-stone-700">{col.label}</p>
                    <span className="ml-auto text-xs bg-white/80 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        loading={loadingId === task.id}
                        currentStatus={col.value as HousekeepingTask["status"]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile list */}
          <div className="lg:hidden space-y-3">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.value] || [];
              if (colTasks.length === 0) return null;
              return (
                <div key={col.value}>
                  <div className="flex items-center gap-2 mb-2">
                    <col.icon size={14} className="text-stone-400" />
                    <p className="text-sm font-semibold text-stone-600">{col.label} ({colTasks.length})</p>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        loading={loadingId === task.id}
                        currentStatus={col.value as HousekeepingTask["status"]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddTaskDialog
        open={showAddTask}
        onClose={() => { setShowAddTask(false); router.refresh(); }}
        rooms={rooms}
      />
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onStatusChange,
  onDelete,
  loading,
  currentStatus,
}: {
  task: TaskWithRoom;
  onStatusChange: (id: string, s: HousekeepingTask["status"]) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  currentStatus: HousekeepingTask["status"];
}) {
  const priority = PRIORITY_CONFIG[task.priority || "normal"] || PRIORITY_CONFIG.normal;

  const nextStatus: Record<HousekeepingTask["status"], HousekeepingTask["status"] | null> = {
    pending: "in_progress",
    in_progress: "completed",
    completed: "inspected",
    inspected: null,
  };

  const nextStatusLabels: Record<string, string> = {
    in_progress: "Démarrer",
    completed: "Terminer",
    inspected: "Inspecter",
  };

  const next = nextStatus[currentStatus];

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-stone-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">
            {task.room?.name || "Chambre"} <span className="text-xs text-stone-400">#{task.room?.room_number}</span>
          </p>
          <p className="text-xs text-stone-500">{TYPE_LABELS[task.type || "daily_clean"]}</p>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          disabled={loading}
          className="text-stone-200 hover:text-red-400 transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.className}`}>
          {priority.label}
        </span>
        <span className="text-[10px] text-stone-400">
          {task.created_at && formatRelative(task.created_at)}
        </span>
      </div>

      {task.notes && (
        <p className="text-xs text-stone-500 mt-2 italic truncate">{task.notes}</p>
      )}

      {next && (
        <button
          onClick={() => onStatusChange(task.id, next)}
          disabled={loading}
          className="w-full mt-2 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : null}
          {nextStatusLabels[next]} →
        </button>
      )}
    </div>
  );
}

// Add Task Dialog
function AddTaskDialog({
  open,
  onClose,
  rooms,
}: {
  open: boolean;
  onClose: () => void;
  rooms: Partial<Room>[];
}) {
  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState<HousekeepingTask["type"]>("daily_clean");
  const [priority, setPriority] = useState<HousekeepingTask["priority"]>("normal");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) { toast.error("Sélectionner une chambre"); return; }
    setLoading(true);
    try {
      await createHousekeepingTask({ room_id: roomId, type, priority, notes: notes || null });
      toast.success("Tâche créée");
      setRoomId(""); setNotes("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Nouvelle tâche de ménage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Chambre *</Label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="">Sélectionner une chambre</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name} (#{r.room_number})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HousekeepingTask["type"])}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="daily_clean">Quotidien</option>
                <option value="checkout_clean">Départ</option>
                <option value="deep_clean">Grand nettoyage</option>
                <option value="turndown">Couverture</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as HousekeepingTask["priority"])}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Textarea
              rows={2}
              placeholder="Instructions spéciales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
              {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
