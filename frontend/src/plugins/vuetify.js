import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    primary: '#6366f1',    // Indigo
                    secondary: '#8b5cf6',  // Purple
                    accent: '#ec4899',     // Pink
                    success: '#10b981',    // Green
                    warning: '#f59e0b',    // Amber
                    error: '#ef4444',      // Red
                    info: '#3b82f6',       // Blue
                    background: '#0f172a', // Dark Slate
                    surface: '#1e293b',    // Slate 800
                },
            },
            light: {
                dark: false,
                colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#ec4899',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                },
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
    },
})
