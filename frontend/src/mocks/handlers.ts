/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { RequestHandler } from 'msw'

import { getDemoHandlers } from './demo'

// Base MSW handlers are intentionally empty: production builds do not load
// MSW at all (gated by VITE_USE_MSW). The login handler that previously lived
// here is now part of the demo handler set, which only activates when
// VITE_DEMO_MODE=true (see ./demo/index.ts).
const baseHandlers: RequestHandler[] = []

export const handlers = [...baseHandlers, ...getDemoHandlers()]
