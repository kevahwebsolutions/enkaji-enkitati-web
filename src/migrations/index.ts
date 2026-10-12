import * as migration_20261011_203917_initial from './20261011_203917_initial'
import * as migration_20261011_210139_programs_body from './20261011_210139_programs_body'
import * as migration_20261011_231512_impact_annual_plan from './20261011_231512_impact_annual_plan'
import * as migration_20261011_234618_event_rsvp from './20261011_234618_event_rsvp'
import * as migration_20261012_011856_forms from './20261012_011856_forms'

export const migrations = [
  {
    up: migration_20261011_203917_initial.up,
    down: migration_20261011_203917_initial.down,
    name: '20261011_203917_initial',
  },
  {
    up: migration_20261011_210139_programs_body.up,
    down: migration_20261011_210139_programs_body.down,
    name: '20261011_210139_programs_body',
  },
  {
    up: migration_20261011_231512_impact_annual_plan.up,
    down: migration_20261011_231512_impact_annual_plan.down,
    name: '20261011_231512_impact_annual_plan',
  },
  {
    up: migration_20261011_234618_event_rsvp.up,
    down: migration_20261011_234618_event_rsvp.down,
    name: '20261011_234618_event_rsvp',
  },
  {
    up: migration_20261012_011856_forms.up,
    down: migration_20261012_011856_forms.down,
    name: '20261012_011856_forms',
  },
]
