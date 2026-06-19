import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPTS = [
  { code: 'ACC', nom: 'Accueil', couleur: '#7c5cd6' },
  { code: 'SEC', nom: 'Sécurité', couleur: '#6f8fd0' },
  { code: 'PRO', nom: 'Projection', couleur: '#c08a5a' },
  { code: 'LOU', nom: 'Louange', couleur: '#c97fb0' },
  { code: 'PRI', nom: 'Prière', couleur: '#5fae9a' },
  { code: 'COM', nom: 'Communication', couleur: '#5b7fb0' },
  { code: 'INT', nom: 'Intercession', couleur: '#8a6fb0', confidentiel: true },
];

const STARS_DATA = [
  { prenom: 'Sophie', nom: 'Martin', tel: '06 11 22 33 44', depts: ['ACC', 'PRI'], statut: 'Actif' as const },
  { prenom: 'Jean', nom: 'Dupont', tel: '06 22 33 44 55', depts: ['SEC'], statut: 'Actif' as const },
  { prenom: 'Marie', nom: 'Leclair', tel: '06 33 44 55 66', depts: ['LOU'], statut: 'Actif' as const },
  { prenom: 'Paul', nom: 'Bernard', tel: '06 44 55 66 77', depts: ['PRO', 'COM'], statut: 'Actif' as const },
  { prenom: 'Lucie', nom: 'Morel', tel: '06 55 66 77 88', depts: ['ACC'], statut: 'Occasionnel' as const },
  { prenom: 'Thomas', nom: 'Petit', tel: '06 66 77 88 99', depts: ['SEC', 'ACC'], statut: 'Actif' as const },
  { prenom: 'Claire', nom: 'Dubois', tel: '06 77 88 99 00', depts: ['LOU', 'PRI'], statut: 'Actif' as const },
  { prenom: 'Marc', nom: 'Rousseau', tel: '06 88 99 00 11', depts: ['COM'], statut: 'EnPause' as const },
  { prenom: 'Emma', nom: 'Lambert', tel: '06 99 00 11 22', depts: ['PRO'], statut: 'Actif' as const },
  { prenom: 'David', nom: 'Simon', tel: '07 11 22 33 44', depts: ['ACC', 'SEC'], statut: 'Actif' as const },
  { prenom: 'Nadia', nom: 'Fontaine', tel: '07 22 33 44 55', depts: ['INT'], statut: 'Actif' as const },
  { prenom: 'Pierre', nom: 'Legrand', tel: '07 33 44 55 66', depts: ['ACC'], statut: 'Ancien' as const },
];

async function main() {
  console.log('🌱 Seeding OBEY database...');

  // Departments
  for (const dept of DEPTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      create: dept,
      update: dept,
    });
  }
  console.log(`✅ ${DEPTS.length} departments`);

  // Admin user
  const adminHash = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@obey.app' },
    create: {
      email: 'admin@obey.app',
      passwordHash: adminHash,
      statut: 'Actif',
      star: { create: { prenom: 'Admin', nom: 'OBEY', tel: '' } },
      roles: { create: [{ type: 'ADMINISTRATEUR' }, { type: 'COORDINATION_GENERALE' }] },
    },
    update: {},
  });
  console.log(`✅ Admin: admin@obey.app / admin1234 (id=${admin.id})`);

  // Référent ACC
  const refHash = await bcrypt.hash('referent1234', 10);
  const ref = await prisma.user.upsert({
    where: { email: 'referent.acc@obey.app' },
    create: {
      email: 'referent.acc@obey.app',
      passwordHash: refHash,
      statut: 'Actif',
      star: { create: { prenom: 'Isabelle', nom: 'Lefèvre', tel: '07 50 00 00 01' } },
      roles: {
        create: [
          { type: 'REFERENT', deptCode: 'ACC' },
          { type: 'STAR' },
        ],
      },
    },
    update: {},
  });
  console.log(`✅ Référent ACC: referent.acc@obey.app / referent1234 (id=${ref.id})`);

  // Stars
  for (const s of STARS_DATA) {
    const email = `${s.prenom.toLowerCase()}.${s.nom.toLowerCase()}@obey.app`;
    const hash = await bcrypt.hash('star1234', 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        statut: 'Actif',
        star: {
          create: {
            prenom: s.prenom,
            nom: s.nom,
            tel: s.tel,
            statut: s.statut,
            departments: { createMany: { data: s.depts.map((c) => ({ deptCode: c })) } },
          },
        },
        roles: { create: { type: 'STAR' } },
      },
    });
  }
  console.log(`✅ ${STARS_DATA.length} stars (password: star1234)`);

  // Event template
  await prisma.eventTemplate.upsert({
    where: { id: 1 },
    create: {
      nom: 'Culte dominical',
      needs: {
        createMany: {
          data: [
            { deptCode: 'ACC', requis: 4 },
            { deptCode: 'SEC', requis: 2 },
            { deptCode: 'PRO', requis: 2 },
            { deptCode: 'LOU', requis: 3 },
          ],
        },
      },
    },
    update: {},
  });

  // Sample events
  const events = [
    { nom: 'Culte Dimanche 5 Jan', date: new Date('2025-01-05T10:00:00'), debut: '09:45', fin: '12:30', lieu: 'Salle principale' },
    { nom: 'Culte Dimanche 12 Jan', date: new Date('2025-01-12T10:00:00'), debut: '09:45', fin: '12:30', lieu: 'Salle principale' },
    { nom: 'Culte Dimanche 19 Jan', date: new Date('2025-01-19T10:00:00'), debut: '09:45', fin: '12:30', lieu: 'Salle principale' },
  ];

  for (const e of events) {
    const existing = await prisma.event.findFirst({ where: { nom: e.nom } });
    if (!existing) {
      await prisma.event.create({
        data: {
          ...e,
          needs: {
            createMany: {
              data: [
                { deptCode: 'ACC', requis: 4 },
                { deptCode: 'SEC', requis: 2 },
                { deptCode: 'PRO', requis: 2 },
              ],
            },
          },
        },
      });
    }
  }
  console.log(`✅ ${events.length} sample events`);

  // Parameters
  const params = [
    { cle: 'SCORE_CHARGE_MAX', val: '10', type: 'number', label: 'Charge max', desc: 'Seuil de charge maximale', groupe: 'planning' },
    { cle: 'SCORE_FIAB_MIN', val: '0.5', type: 'range', label: 'Fiabilité minimale', desc: 'Score de fiabilité minimum', groupe: 'planning' },
    { cle: 'DESISTEMENT_DEADLINE_JOURS', val: '7', type: 'number', label: 'Délai désistement (jours)', desc: 'Nb de jours avant event', groupe: 'planning', unite: 'jours' },
    { cle: 'NOTIF_EMAIL', val: 'true', type: 'toggle', label: 'Notifications email', groupe: 'notifications' },
    { cle: 'NOTIF_WHATSAPP', val: 'false', type: 'toggle', label: 'Notifications WhatsApp', groupe: 'notifications' },
  ];

  for (const p of params) {
    await prisma.parameter.upsert({ where: { cle: p.cle }, create: p, update: p });
  }
  console.log(`✅ ${params.length} parameters`);

  console.log('\n🎉 Seed complete!');
  console.log('   admin@obey.app / admin1234');
  console.log('   referent.acc@obey.app / referent1234');
  console.log('   sophie.martin@obey.app / star1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
