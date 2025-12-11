const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создаем категории
  const categories = [
    'design',
    'development',
    'marketing',
    'copywriting',
    'translation',
    'photography',
    'video_editing',
    'consulting',
    'animation',
    'modeling_3d',
    'web_development',
    'qa_testing',
    'customer_support',
    'seo',
    'smm',
    'targeted_ads',
    'contextual_ads',
    'legal_help',
    'accounting',
    'tutoring',
    'mentoring',
    'cargo_transport',
    'device_repair',
    'furniture_assembly',
    'cleaning',
    'construction',
    'plumbing',
    'electrician',
    'courier',
    'tech_support',
    'devops',
    'data_science',
    'machine_learning',
    'interior_design',
    'hr',
    'pr',
    'voice_over',
    'sound_design',
    'catering',
    'event_services',
    'decor',
    'beauty_massage',
    'hair_services',
    'landscape_design',
    'security',
    'logistics',
    'rental',
    'other'
  ]
  
  
  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    })
  }

  console.log('✅ Categories seeded successfully')
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
