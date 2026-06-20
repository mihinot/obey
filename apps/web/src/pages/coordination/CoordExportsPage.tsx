import { useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const EXPORT_TYPES = [
  { id: 'global', label: 'Planning global', desc: 'Tous les événements à venir' },
  { id: 'evenement', label: 'Planning par événement', desc: 'Affectations d\'un événement' },
  { id: 'departement', label: 'Planning par département', desc: 'Équipe d\'un département' },
  { id: 'stats', label: 'Statistiques de charge', desc: 'Indicateurs et métriques' },
]

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'excel', label: 'Excel' },
]

function PdfPreview({ type }: { type: string }) {
  return (
    <div style={{
      width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '6px',
      boxShadow: '0 4px 24px rgba(124,92,214,0.1)', padding: '34px 36px',
      fontFamily: 'Figtree, sans-serif', minHeight: '420px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: `2px solid ${T.primary}`, paddingBottom: '14px', marginBottom: '18px',
      }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '18px', color: T.primary }}>OBEY</div>
          <div style={{ fontSize: '10px', color: T.muted, fontStyle: 'italic', marginTop: '2px' }}>Disponibles pour Servir avec Amour</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10.5px', color: T.sub }}>
          Édité le {new Date().toLocaleDateString('fr-FR')}<br />Page 1 / 1
        </div>
      </div>

      {type === 'global' && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>Planning global — Juin 2026</div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '4px', marginBottom: '16px' }}>Tous les événements à venir</div>
          {['Culte dominical', 'Soirée Louange', 'Formation STARs'].map((nom, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: '12px' }}>
              <span style={{ fontWeight: 600, color: T.ink }}>{nom}</span>
              <span style={{ color: T.sub }}>22 juin · Auditorium</span>
            </div>
          ))}
        </>
      )}

      {type === 'evenement' && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>Planning · Culte dominical</div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '4px', marginBottom: '16px' }}>Dimanche 22 juin 2026 · 09:00–12:30</div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: T.primary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Département Accueil</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['STAR', 'Rôle', 'Statut'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Statut' ? 'right' : 'left', padding: '6px 0', color: T.sub, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Marie D.', 'Pierre M.', 'Sophie L.'].map((name, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 0', fontWeight: 600 }}>{name}</td>
                  <td style={{ color: T.sub }}>STAR</td>
                  <td style={{ textAlign: 'right', color: T.ok, fontWeight: 600 }}>Confirmé</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {type === 'departement' && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>Équipe — Département Musique</div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '4px', marginBottom: '16px' }}>12 membres actifs</div>
          {['Marie D.', 'Paul R.', 'Anne C.', 'Jean T.'].map((name, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: '12px' }}>
              <span style={{ fontWeight: 600 }}>{name}</span>
              <span style={{ color: T.ok }}>Actif · charge {40 + i * 10}%</span>
            </div>
          ))}
        </>
      )}

      {type === 'stats' && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>Statistiques de charge</div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '4px', marginBottom: '16px' }}>Période : Juin 2026</div>
          {[['STARs actifs', '48'], ['Taux confirmation', '87%'], ['Événements', '12'], ['Désistements', '3']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: '12px' }}>
              <span style={{ color: T.sub }}>{k}</span>
              <span style={{ fontWeight: 700, color: T.ink }}>{v}</span>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: '28px', fontSize: '9.5px', color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: '8px' }}>
        Document généré par OBEY — confidentiel · usage interne
      </div>
    </div>
  )
}

function ExcelPreview({ type }: { type: string }) {
  const headers = type === 'stats'
    ? ['Département', 'STARs', 'Actifs', 'Taux confirt.', 'Charge moy.']
    : ['STAR', 'Département', 'Rôle', 'Statut', 'Charge']

  const rows = type === 'stats'
    ? [['Accueil', '8', '7', '92%', '45%'], ['Musique', '12', '10', '85%', '60%'], ['Médias', '6', '5', '80%', '38%'], ['Enfants', '10', '9', '90%', '50%']]
    : [['Marie D.', 'Accueil', 'STAR', 'Confirmé', '45%'], ['Pierre M.', 'Musique', 'STAR', 'Confirmé', '60%'], ['Sophie L.', 'Accueil', 'STAR', 'En attente', '30%'], ['Jean T.', 'Technique', 'STAR', 'Confirmé', '72%']]

  return (
    <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', fontSize: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e7145', color: '#fff', padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}>
        <span style={{ fontFamily: 'monospace' }}>⊞</span> planning_export.xlsx
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ background: '#f3f3f3', padding: '7px 6px', width: '28px', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }} />
              {headers.map((h, i) => (
                <th key={i} style={{ background: '#f3f3f3', padding: '7px 10px', fontWeight: 700, borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', color: '#444', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td style={{ background: '#f8f8f8', padding: '7px 6px', fontSize: '10.5px', color: '#999', textAlign: 'center', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #eee' }}>{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '7px 10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', color: ci === 0 ? '#222' : '#555', fontWeight: ci === 0 ? 600 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function downloadCSV(type: string) {
  const headers = type === 'stats'
    ? ['Département', 'STARs', 'Actifs', 'Taux confirmation', 'Charge moyenne']
    : ['STAR', 'Département', 'Rôle', 'Statut', 'Charge']

  const rows = type === 'stats'
    ? [['Accueil', '8', '7', '92%', '45%'], ['Musique', '12', '10', '85%', '60%'], ['Médias', '6', '5', '80%', '38%'], ['Enfants', '10', '9', '90%', '50%']]
    : [['Marie D.', 'Accueil', 'STAR', 'Confirmé', '45%'], ['Pierre M.', 'Musique', 'STAR', 'Confirmé', '60%']]

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `obey_export_${type}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CoordExportsPage() {
  const [type, setType] = useState('evenement')
  const [format, setFormat] = useState('pdf')

  const handleDownload = () => {
    if (format === 'excel') {
      downloadCSV(type)
    } else {
      window.print()
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Exports
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Générer des documents PDF ou Excel à partir des plannings
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Panneau gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card pad={16}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.sub, marginBottom: '10px', letterSpacing: '0.06em' }}>TYPE D'EXPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXPORT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    border: `1px solid ${type === t.id ? T.primary : T.border}`,
                    background: type === t.id ? T.primarySoft : '#fff',
                    color: type === t.id ? T.primaryDeep : T.ink,
                    cursor: 'pointer', padding: '11px 13px', borderRadius: T.radius,
                    textAlign: 'left',
                  }}
                >
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
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  style={{
                    flex: 1, border: `1px solid ${format === f.id ? T.primary : T.border}`,
                    background: format === f.id ? T.primarySoft : '#fff',
                    color: format === f.id ? T.primaryDeep : T.sub,
                    cursor: 'pointer', padding: '11px', borderRadius: T.radius,
                    fontSize: '13.5px', fontWeight: 700,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Card>

          <div style={{
            display: 'flex', gap: '10px', background: T.primarySoft + '80',
            borderRadius: T.radius, padding: '13px', fontSize: '12.5px', color: T.primaryDeep, lineHeight: 1.45,
          }}>
            <span>🔒</span>
            <span>Le département <strong>Intercession</strong> et les données pastorales sont automatiquement exclus des exports standards.</span>
          </div>

          <Btn variant="primary" size="lg" onClick={handleDownload}>
            Télécharger le {format.toUpperCase()}
          </Btn>
        </div>

        {/* Aperçu */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            fontSize: '12.5px', color: T.sub, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            🔍 Aperçu
          </div>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', background: T.bg }}>
            {format === 'pdf' ? <PdfPreview type={type} /> : <ExcelPreview type={type} />}
          </div>
        </Card>
      </div>
    </div>
  )
}
