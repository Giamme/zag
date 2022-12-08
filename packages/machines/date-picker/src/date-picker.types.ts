import type { StateMachine as S } from "@zag-js/core"
import type { CommonProperties, Context, DirectionProperty, RequiredBy } from "@zag-js/types"

type PublicContext = DirectionProperty & CommonProperties & {}

type PrivateContext = Context<{}>

type ComputedContext = Readonly<{}>

export type UserDefinedContext = RequiredBy<PublicContext, "id">

export type MachineContext = PublicContext & PrivateContext & ComputedContext

export type MachineState = {
  value: "unknown"
}

export type State = S.State<MachineContext, MachineState>

export type Send = S.Send<S.AnyEventObject>