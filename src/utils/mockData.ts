import { faker } from '@faker-js/faker';
import { Recipe, Category, Difficulty } from '../types';

const categories: Category[] = ['antipasto', 'primo', 'secondo', 'contorno', 'dolce', 'bevanda', 'veg', 'gluten-free', 'light'];
const difficulties: Difficulty[] = ['facile', 'media', 'difficile'];

export function generateMockRecipes(count: number = 12): Recipe[] {
  return Array.from({ length: count }, (_, index) => {
    const category = faker.helpers.arrayElement(categories);
    const difficulty = faker.helpers.arrayElement(difficulties);
    
    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentences(2),
      category,
      ingredients: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
        item: faker.lorem.words(2),
        quantity: `${faker.number.int({ min: 50, max: 500 })}g`
      })),
      steps: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, (_, stepIndex) => ({
        number: stepIndex + 1,
        text: faker.lorem.sentences(2)
      })),
      timeMinutes: faker.number.int({ min: 15, max: 180 }),
      difficulty,
      calories: faker.number.int({ min: 150, max: 800 }),
      image: `https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300/f1f5f9/64748b?text=Ricetta+${index + 1}`,
      notes: faker.lorem.sentences(1),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    };
  });
}
