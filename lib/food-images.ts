/**
 * Culinary visual assets & dish photography mapping for Tandoori Stop
 */

export interface DishVisual {
  name: string
  image: string
  category: string
  description?: string
}

export const FEATURED_SPECIALTIES: DishVisual[] = [
  {
    name: 'Tandoori Chicken (Full / Half)',
    image: '/images/food/tandoori-chicken.jpg',
    category: 'Tandoori & Grills',
    description: 'Charcoal clay oven roasted chicken infused with Kashmiri red chilli, yogurt & garam masala',
  },
  {
    name: 'Royal Chicken Dum Biryani',
    image: '/images/food/chicken-biryani.jpg',
    category: 'Rice & Biryani',
    description: 'Fragrant basmati rice slow-cooked in dum style with saffron, tender chicken & fried onions',
  },
  {
    name: 'Tandoori Seekh Kebab Platter',
    image: '/images/food/hero-tandoor.jpg',
    category: 'Tandoori & Grills',
    description: 'Minced mutton & beef skewers grilled over glowing red tandoor charcoal embers',
  },
]

/**
 * Returns a high quality image path matching a product's name or category
 */
export function getProductImage(productName: string, categoryName?: string): string {
  const name = productName.toLowerCase()
  const cat = (categoryName ?? '').toLowerCase()

  if (name.includes('tandoori') || name.includes('chicken') || name.includes('tikka') || name.includes('boti')) {
    return '/images/food/tandoori-chicken.jpg'
  }
  if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) {
    return '/images/food/chicken-biryani.jpg'
  }
  if (name.includes('kebab') || name.includes('grill') || name.includes('platter') || name.includes('sizzler')) {
    return '/images/food/hero-tandoor.jpg'
  }
  if (cat.includes('grill') || cat.includes('tandoor') || cat.includes('bbq')) {
    return '/images/food/tandoori-chicken.jpg'
  }
  if (cat.includes('rice') || cat.includes('biryani')) {
    return '/images/food/chicken-biryani.jpg'
  }

  // Fallback to signature tandoor hero
  return '/images/food/hero-tandoor.jpg'
}
