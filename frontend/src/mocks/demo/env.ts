export const isDemoMode = (): boolean => import.meta.env.VITE_DEMO_MODE === 'true'

export const DEMO_USERS_STORAGE_KEY = 'crater.demo.user'
export const DEMO_PENDING_CONFIRMS_KEY = 'crater.demo.pendingConfirms'
export const DEMO_PACING_KEY = 'demo.pacing'
