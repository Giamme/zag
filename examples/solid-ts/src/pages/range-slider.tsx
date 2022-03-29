import { injectGlobal } from "@emotion/css"
import * as RangeSlider from "@ui-machines/range-slider"
import { normalizeProps, PropTypes, useMachine, useSetup } from "@ui-machines/solid"
import serialize from "form-serialize"
import { createMemo, For, createUniqueId } from "solid-js"
import { rangeSliderControls } from "../../../../shared/controls"
import { sliderStyle } from "../../../../shared/style"
import { StateVisualizer } from "../components/state-visualizer"
import { useControls } from "../hooks/use-controls"

injectGlobal(sliderStyle)

export default function Page() {
  const controls = useControls(rangeSliderControls)

  const [state, send] = useMachine(
    RangeSlider.machine.withContext({
      name: "quantity",
      value: [10, 60],
    }),
    { context: controls.context as any },
  )

  const ref = useSetup<HTMLDivElement>({ send, id: createUniqueId() })

  const api = createMemo(() => RangeSlider.connect<PropTypes>(state, send, normalizeProps))

  return (
    <>
      <controls.ui />

      <form
        // ensure we can read the value within forms
        onInput={(e) => {
          const formData = serialize(e.currentTarget, { hash: true })
          console.log(formData)
        }}
      >
        <div ref={ref} {...api().rootProps}>
          <div>
            <label {...api().labelProps}>Quantity:</label>
            <output {...api().outputProps}>{api().values.join(" - ")}</output>
          </div>

          <div className="control-area">
            <div {...api().controlProps}>
              <div {...api().trackProps}>
                <div {...api().rangeProps} />
              </div>
              <For each={api().values}>
                {(_, index) => (
                  <div className="slider__thumb" {...api().getThumbProps(index())}>
                    <input {...api().getInputProps(index())} />
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </form>

      <StateVisualizer state={state} />
    </>
  )
}
