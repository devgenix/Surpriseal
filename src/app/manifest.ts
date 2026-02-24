import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Surpriseal',
    short_name: 'Surpriseal',
    description: 'Create Unforgettable Digital Surprises',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FFFBF8',
    theme_color: '#e64c19',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
