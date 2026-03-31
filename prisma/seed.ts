import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create initial user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Created user:', user.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Getting Started' },
      update: {},
      create: { name: 'Getting Started', description: 'Quick start guides and tutorials' },
    }),
    prisma.category.upsert({
      where: { name: 'API Reference' },
      update: {},
      create: { name: 'API Reference', description: 'API documentation and references' },
    }),
    prisma.category.upsert({
      where: { name: 'Guides' },
      update: {},
      create: { name: 'Guides', description: 'Detailed guides and tutorials' },
    }),
  ])

  console.log('Created categories:', categories.map(c => c.name))

  // Create sample documents with hierarchy
  const quickStart = await prisma.document.upsert({
    where: { slug: 'quick-start' },
    update: {},
    create: {
      title: 'Quick Start',
      slug: 'quick-start',
      content: `# Quick Start

Welcome to our documentation platform! This guide will help you get started quickly.

## Installation

\`\`\`bash
npm install
\`\`\`

## Basic Usage

Here's how to use our platform effectively.

## Next Steps

Check out our API reference for more details.`,
      excerpt: 'Get started quickly with our platform',
      published: true,
      authorId: user.id,
      categoryId: categories[0].id,
    },
  })

  const installation = await prisma.document.upsert({
    where: { slug: 'installation' },
    update: {},
    create: {
      title: 'Installation',
      slug: 'installation',
      content: `# Installation

Learn how to install and set up the project.

## Requirements

- Node.js 18+
- npm or yarn

## Steps

1. Clone the repository
2. Install dependencies
3. Configure environment variables`,
      excerpt: 'Installation guide for the project',
      published: true,
      authorId: user.id,
      categoryId: categories[0].id,
      parentId: quickStart.id,
    },
  })

  const apiOverview = await prisma.document.upsert({
    where: { slug: 'api-overview' },
    update: {},
    create: {
      title: 'API Overview',
      slug: 'api-overview',
      content: `# API Overview

Our API provides a comprehensive set of endpoints for integrating with our platform.

## Base URL

\`\`\`
https://api.example.com/v1
\`\`\`

## Authentication

All API requests require authentication using Bearer tokens.

## Rate Limiting

API requests are limited to 1000 requests per hour.`,
      excerpt: 'Overview of the API endpoints and authentication',
      published: true,
      authorId: user.id,
      categoryId: categories[1].id,
    },
  })

  console.log('Created documents:', [quickStart.title, installation.title, apiOverview.title])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
