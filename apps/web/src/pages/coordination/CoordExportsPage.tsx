import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { T } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function apiGet<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

const EXPORT_TYPES = [
  { id: 'global', label: 'Planning global', desc: 'Tous les événements à venir' },
  { id: 'evenement', label: 'Planning par événement', desc: 'Affectations d\'un événement' },
  { id: 'departement', label: 'Planning par département', desc: 'Équipe d\'un département' },
  { id: 'stats', label: 'Statistiques de charge', desc: 'Indicateurs et métriques' },
]

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'excel', label: 'Excel (CSV)' },
]

function addPdfHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(124, 92, 214)
  doc.text('OBEY', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 150, 173)
  doc.text('Disponibles pour Servir avec Amour', 14, 23)
  doc.setDrawColor(124, 92, 214)
  doc.setLineWidth(0.5)
  doc.line(14, 26, 196, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(44, 37, 53)
  doc.text(title, 14, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(108, 99, 121)
  doc.text(subtitle, 14, 39)
  doc.setFontSize(8)
  doc.setTextColor(160, 150, 173)
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 196, 18, { align: 'right' })
}

function addPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 215, 230)
    doc.setLineWidth(0.3)
    doc.line(14, 284, 196, 284)
    doc.setFontSize(7.5)
    doc.setTextColor(160, 150, 173)
    doc.text('Document généré par OBEY — confidentiel · usage interne', 14, 289)
    doc.text(`Page ${i} / ${pageCount}`, 196, 289, { align: 'right' })
  }
}

async function generatePDF(type: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const dateStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (type === 'global') {
    const events = await apiGet<{ id: number; nom: string; date: string; debut: string; fin: string; lieu: string; statut: string }[]>('/events?upcoming=true')
    addPdfHeader(doc, 'Planning global', `Événements à venir — ${dateStr}`)
    autoTable(doc, {
      startY: 44,
      head: [['Événement', 'Date', 'Horaire', 'Lieu', 'Statut']],
      body: events.map(e => [
        e.nom,
        new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        `${e.debut}–${e.fin}`,
        e.lieu || '—',
        e.statut,
      ]),
      headStyles: { fillColor: [124, 92, 214], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [246, 242, 251] },
    })

  } else if (type === 'evenement') {
    const events = await apiGet<{ id: number; nom: string; date: string; debut: string; fin: string }[]>('/events?upcoming=true')
    if (events.length === 0) { alert('Aucun événement à venir'); return }
    const ev = events[0]
    const detail = await apiGet<{
      nom: string; date: string; debut: string; fin: string; lieu: string
      assignments: { star: { prenom: string; nom: string }; deptCode: string; statut: string }[]
    }>(`/events/${ev.id}`)
    const dateLabel = new Date(detail.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    addPdfHeader(doc, `Planning · ${detail.nom}`, `${dateLabel} · ${detail.debut}–${detail.fin}`)
    const rows = detail.assignments
      .filter(a => a.deptCode !== 'INT')
      .map(a => [`${a.star.prenom} ${a.star.nom}`, a.deptCode, a.statut])
    autoTable(doc, {
      startY: 44,
      head: [['STAR', 'Département', 'Statut']],
      body: rows.length > 0 ? rows : [['Aucune affectation', '', '']],
      headStyles: { fillColor: [124, 92, 214], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [246, 242, 251] },
    })

  } else if (type === 'departement') {
    const stars = await apiGet<{ prenom: string; nom: string; statut: string; charge: number; fiab: number; departments: { deptCode: string }[] }[]>('/stars?statut=Actif')
    addPdfHeader(doc, 'Planning par département', `Équipes actives — ${dateStr}`)
    const byDept: Record<string, typeof stars> = {}
    stars.forEach(s => s.departments.filter(d => d.deptCode !== 'INT').forEach(d => {
      if (!byDept[d.deptCode]) byDept[d.deptCode] = []
      byDept[d.deptCode].push(s)
    }))
    let y = 44
    Object.entries(byDept).sort(([a], [b]) => a.localeCompare(b)).forEach(([dept, members]) => {
      autoTable(doc, {
        startY: y,
        head: [[{ content: `Département ${dept}`, colSpan: 3, styles: { halign: 'left', fillColor: [124, 92, 214], textColor: 255 } }],
               ['STAR', 'Statut', 'Charge']],
        body: members.map(s => [`${s.prenom} ${s.nom}`, s.statut, `${s.charge}/5`]),
        headStyles: { fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [246, 242, 251] },
        margin: { top: 44 },
      })
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      if (y > 260) { doc.addPage(); y = 20 }
    })

  } else if (type === 'stats') {
    const stars = await apiGet<{ statut: string; charge: number; desist: number; fiab: number }[]>('/stars')
    const actifs = stars.filter(s => s.statut === 'Actif').length
    const surcharge = stars.filter(s => s.charge >= 4).length
    const avgFiab = stars.length > 0 ? stars.reduce((s, x) => s + x.fiab, 0) / stars.length : 0
    const totalDesist = stars.reduce((s, x) => s + x.desist, 0)
    addPdfHeader(doc, 'Statistiques de charge', `Rapport — ${dateStr}`)
    autoTable(doc, {
      startY: 44,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Total STARs', String(stars.length)],
        ['STARs actifs', String(actifs)],
        ['STARs en surcharge (charge ≥ 4)', String(surcharge)],
        ['Fiabilité moyenne', `${Math.round(avgFiab * 100)}%`],
        ['Total désistements', String(totalDesist)],
      ],
      headStyles: { fillColor: [124, 92, 214], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [246, 242, 251] },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } },
    })
  }

  addPdfFooter(doc)
  doc.save(`obey_${type}_${new Date().toISOString().split('T')[0]}.pdf`)
}

async function generateCSV(type: string) {
  let headers: string[]
  let rows: string[][]

  if (type === 'global') {
    const events = await apiGet<{ nom: string; date: string; debut: string; fin: string; lieu: string; statut: string }[]>('/events?upcoming=true')
    headers = ['Événement', 'Date', 'Début', 'Fin', 'Lieu', 'Statut']
    rows = events.map(e => [e.nom, new Date(e.date).toLocaleDateString('fr-FR'), e.debut, e.fin, e.lieu, e.statut])
  } else if (type === 'evenement') {
    const events = await apiGet<{ id: number; nom: string }[]>('/events?upcoming=true')
    if (events.length === 0) { alert('Aucun événement à venir'); return }
    const detail = await apiGet<{ assignments: { star: { prenom: string; nom: string }; deptCode: string; statut: string }[] }>(`/events/${events[0].id}`)
    headers = ['STAR', 'Département', 'Statut']
    rows = detail.assignments.filter(a => a.deptCode !== 'INT').map(a => [`${a.star.prenom} ${a.star.nom}`, a.deptCode, a.statut])
  } else if (type === 'departement') {
    const stars = await apiGet<{ prenom: string; nom: string; statut: string; charge: number; departments: { deptCode: string }[] }[]>('/stars?statut=Actif')
    headers = ['STAR', 'Département', 'Statut', 'Charge']
    rows = stars.flatMap(s => s.departments.filter(d => d.deptCode !== 'INT').map(d => [`${s.prenom} ${s.nom}`, d.deptCode, s.statut, String(s.charge)]))
  } else {
    const stars = await apiGet<{ statut: string; charge: number; fiab: number }[]>('/stars')
    headers = ['Statut', 'Charge', 'Fiabilité']
    rows = stars.map(s => [s.statut, String(s.charge), `${Math.round(s.fiab * 100)}%`])
  }

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `obey_${type}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function PdfPreview({ type }: { type: string }) {
  return (
    <div style={{
      width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '6px',
      boxShadow: '0 4px 24px rgba(124,92,214,0.1)', padding: '34px 36px',
      fontFamily: 'Figtree, sans-serif', minHeight: '420px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${T.primary}`, paddingBottom: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '18px', color: T.primary }}>OBEY</div>
          <div style={{ fontSize: '10px', color: T.muted, fontStyle: 'italic', marginTop: '2px' }}>Disponibles pour Servir avec Amour</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10.5px', color: T.sub }}>
          Édité le {new Date().toLocaleDateString('fr-FR')}<br />Page 1 / 1
        </div>
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '6px' }}>
        {EXPORT_TYPES.find(t => t.id === type)?.label}
      </div>
      <div style={{ fontSize: '11.5px', color: T.sub, marginBottom: '16px' }}>
        {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
      </div>
      <div style={{ fontSize: '12px', color: T.muted, fontStyle: 'italic' }}>
        Le fichier PDF sera généré avec les données réelles au moment du téléchargement.
      </div>
      <div style={{ marginTop: '28px', fontSize: '9.5px', color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: '8px' }}>
        Document généré par OBEY — confidentiel · usage interne
      </div>
    </div>
  )
}

function ExcelPreview() {
  return (
    <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', fontSize: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e7145', color: '#fff', padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}>
        <span style={{ fontFamily: 'monospace' }}>⊞</span> planning_export.csv
      </div>
      <div style={{ padding: '16px', fontSize: '12px', color: T.sub, fontStyle: 'italic' }}>
        Le fichier CSV sera généré avec les données réelles. Compatible Excel, LibreOffice, Google Sheets.
      </div>
    </div>
  )
}

export default function CoordExportsPage() {
  const [type, setType] = useState('global')
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      if (format === 'pdf') {
        await generatePDF(type)
      } else {
        await generateCSV(type)
      }
    } catch {
      alert('Erreur lors de la génération du fichier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Exports</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Générer des documents PDF ou CSV à partir des plannings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card pad={16}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.sub, marginBottom: '10px', letterSpacing: '0.06em' }}>TYPE D'EXPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXPORT_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  border: `1px solid ${type === t.id ? T.primary : T.border}`,
                  background: type === t.id ? T.primarySoft : '#fff',
                  color: type === t.id ? T.primaryDeep : T.ink,
                  cursor: 'pointer', padding: '11px 13px', borderRadius: T.radius, textAlign: 'left',
                }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontSize: '11px', color: type === t.id ? T.primary : T.muted }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card pad={16}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.sub, marginBottom: '10px', letterSpacing: '0.06em' }}>FORMAT</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{
                  flex: 1, border: `1px solid ${format === f.id ? T.primary : T.border}`,
                  background: format === f.id ? T.primarySoft : '#fff',
                  color: format === f.id ? T.primaryDeep : T.sub,
                  cursor: 'pointer', padding: '11px', borderRadius: T.radius,
                  fontSize: '13.5px', fontWeight: 700,
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '10px', background: T.primarySoft + '80', borderRadius: T.radius, padding: '13px', fontSize: '12.5px', color: T.primaryDeep, lineHeight: 1.45 }}>
            <span>🔒</span>
            <span>Le département <strong>Intercession</strong> et les données pastorales sont automatiquement exclus des exports standards.</span>
          </div>

          <Btn variant="primary" size="lg" loading={loading} onClick={handleDownload}>
            Télécharger le {format === 'pdf' ? 'PDF' : 'CSV'}
          </Btn>
        </div>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, fontSize: '12.5px', color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 Aperçu
          </div>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', background: T.bg }}>
            {format === 'pdf' ? <PdfPreview type={type} /> : <ExcelPreview />}
          </div>
        </Card>
      </div>
    </div>
  )
}
