"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  PROSPECT_ACTIVITY_TYPE_LABELS,
  PROSPECT_ACTIVITY_TYPES,
  PROSPECT_CONTACT_CHANNEL_LABELS,
  PROSPECT_CONTACT_CHANNELS,
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUSES,
  type ProspectActivityTypeValue,
  type ProspectContactChannelValue,
  type ProspectStatusValue,
} from "@/lib/prospects"

type ProspectActivityPanelProps = {
  prospectId: string
  currentStatus: ProspectStatusValue
  currentNextFollowUpAt: string | null
}

export function ProspectActivityPanel({
  prospectId,
  currentStatus,
  currentNextFollowUpAt,
}: ProspectActivityPanelProps) {
  const [status, setStatus] = useState<ProspectStatusValue>(currentStatus)
  const [nextFollowUpAt, setNextFollowUpAt] = useState(currentNextFollowUpAt ?? "")
  const [channel, setChannel] = useState<ProspectContactChannelValue>("OTHER")
  const [activityType, setActivityType] = useState<ProspectActivityTypeValue>("CONTACT_ATTEMPT")
  const [comment, setComment] = useState("")
  const [result, setResult] = useState("")
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)

  async function saveStatus(nextStatus = status) {
    setSavingStatus(true)
    const res = await fetch(`/api/admin/prospects/${prospectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        nextFollowUpAt: nextFollowUpAt || null,
      }),
    })
    setSavingStatus(false)
    if (!res.ok) {
      toast.error("No se pudo actualizar el estado")
      return
    }
    toast.success("Estado actualizado")
  }

  async function saveActivity() {
    setSavingActivity(true)
    const res = await fetch(`/api/admin/prospects/${prospectId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        activityType,
        comment: comment || null,
        result: result || null,
        nextFollowUpAt: nextFollowUpAt || null,
      }),
    })
    setSavingActivity(false)
    if (!res.ok) {
      toast.error("No se pudo registrar la actividad")
      return
    }
    toast.success("Actividad registrada")
    setComment("")
    setResult("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProspectStatusValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROSPECT_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>{PROSPECT_STATUS_LABELS[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proximo seguimiento</Label>
              <Input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => saveStatus("MEETING_SCHEDULED")} disabled={savingStatus}>
              Reunion agendada
            </Button>
            <Button type="button" variant="outline" onClick={() => saveStatus("PROPOSAL_SENT")} disabled={savingStatus}>
              Propuesta enviada
            </Button>
            <Button type="button" variant="outline" onClick={() => saveStatus("WON")} disabled={savingStatus}>
              Marcar ganado
            </Button>
            <Button type="button" variant="destructive" onClick={() => saveStatus("DISCARDED")} disabled={savingStatus}>
              Descartar
            </Button>
            <Button type="button" onClick={() => saveStatus()} disabled={savingStatus}>
              {savingStatus ? "Guardando..." : "Guardar estado"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar actividad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(value) => setChannel(value as ProspectContactChannelValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROSPECT_CONTACT_CHANNELS.map((item) => (
                    <SelectItem key={item} value={item}>{PROSPECT_CONTACT_CHANNEL_LABELS[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={activityType} onValueChange={(value) => setActivityType(value as ProspectActivityTypeValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROSPECT_ACTIVITY_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>{PROSPECT_ACTIVITY_TYPE_LABELS[item]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Comentario</Label>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Resultado</Label>
              <Input value={result} onChange={(event) => setResult(event.target.value)} />
            </div>
          </div>
          <Button type="button" onClick={saveActivity} disabled={savingActivity}>
            {savingActivity ? "Guardando..." : "Registrar actividad"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
