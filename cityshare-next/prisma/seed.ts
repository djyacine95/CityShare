import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const categories = [
    'Clothing',
    'Tools',
    'Furniture',
    'Electronics',
    'Books',
    'Toys',
    'Sports Equipment',
    'Kitchen',
    'Decor',
    'Other',
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('✅ Categories created')

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      profile: {
        create: {
          displayName: 'Test User',
          username: 'testuser',
          bio: 'Just a test user',
          location: 'San Jose, CA',
          isStudent: true,
        },
      },
    },
  })

  console.log('✅ Test user created')

  // Create some sample listings
  const clothingCategory = await prisma.category.findUnique({
    where: { name: 'Clothing' },
  })

  const electronicsCategory = await prisma.category.findUnique({
    where: { name: 'Electronics' },
  })

  const sampleListings = [
    {
      itemName: 'Blue Denim Jacket',
      description: 'Gently used denim jacket, size M. Perfect condition!',
      type: 'sell' as const,
      condition: 'good' as const,
      priceCents: 2500,
      categoryId: clothingCategory?.id,
      userId: user.id,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    },
    {
      itemName: 'Laptop Stand',
      description: 'Aluminum laptop stand, adjustable height',
      type: 'sell' as const,
      condition: 'like_new' as const,
      priceCents: 3000,
      categoryId: electronicsCategory?.id,
      userId: user.id,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
    },
    {
      itemName: 'Winter Coat',
      description: 'Free winter coat, size L. Warm and cozy!',
      type: 'donate' as const,
      condition: 'good' as const,
      priceCents: null,
      categoryId: clothingCategory?.id,
      userId: user.id,
      imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80',
    },
  ]

  for (const listing of sampleListings) {
    await prisma.listing.create({
      data: listing,
    })
  }

  console.log('✅ Sample listings created')
  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
