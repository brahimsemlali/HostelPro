"use client";

import { useState } from "react";
import { Plus, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomCard } from "./RoomCard";
import { RoomFormDialog } from "./RoomFormDialog";
import type { Room, Floor } from "@/types";

type RoomsGridProps = {
  rooms: Partial<Room>[];
  floors: Partial<Floor>[];
};

export function RoomsGrid({ rooms, floors }: RoomsGridProps) {
  const [showAddRoom, setShowAddRoom] = useState(false);

  const activeRooms = rooms.filter((r) => r.status === "active");
  const maintenanceRooms = rooms.filter((r) => r.status === "maintenance");
  const blockedRooms = rooms.filter((r) => r.status === "blocked");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">
            {rooms.length} chambre{rooms.length !== 1 ? "s" : ""} configurée{rooms.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowAddRoom(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus size={16} className="mr-2" />
          Ajouter une chambre
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="hp-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-emerald-600">{activeRooms.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Actives</p>
        </div>
        <div className="hp-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-red-500">{maintenanceRooms.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Maintenance</p>
        </div>
        <div className="hp-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-stone-400">{blockedRooms.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Bloquées</p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyRooms onAdd={() => setShowAddRoom(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
          {/* Add room card */}
          <button
            onClick={() => setShowAddRoom(true)}
            className="hp-card p-6 flex flex-col items-center justify-center gap-3 border-dashed border-stone-300 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer min-h-[180px]"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
              <Plus size={22} className="text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-400">Ajouter une chambre</p>
          </button>
        </div>
      )}

      <RoomFormDialog
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        floors={floors}
      />
    </div>
  );
}

function EmptyRooms({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="hp-card p-12 text-center">
      <DoorOpen size={48} className="text-stone-200 mx-auto mb-4" />
      <h3 className="text-lg font-heading font-semibold text-stone-700 mb-2">
        Pas encore de chambres
      </h3>
      <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
        Ajoutez vos chambres, dortoirs et espaces camping pour commencer à gérer vos réservations.
      </p>
      <Button
        onClick={onAdd}
        className="bg-teal-600 hover:bg-teal-700 text-white"
      >
        <Plus size={16} className="mr-2" />
        Ajouter ma première chambre
      </Button>
    </div>
  );
}
