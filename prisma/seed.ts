import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.dataPlan.deleteMany()

  // Seed Product
  await prisma.product.create({
    data: {
      name: 'Test MTN Router',
      description: 'High speed 5G router with backup battery',
      price: 25000,
      image: 'https://placehold.co/400x400/png?text=Router',
      inStock: true,
    },
  })

  // Seed Data Plan
  await prisma.dataPlan.create({
    data: {
      network: 'MTN',
      data: '1GB',
      validity: '30 days',
      price: 300, 
      planId: 1001, // Valid Amigo ID for MTN 1GB
    },
  })

  console.log('Seeding completed')
}

main()
  .catch((e) => {
    console.error(e)
    ;(process as any).exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })