import * as filePicker from "@zag-js/file-picker"
import { filePickerControls, formatFileSize } from "@zag-js/shared"
import { normalizeProps, useMachine } from "@zag-js/solid"
import { For, createMemo, createUniqueId } from "solid-js"
import { StateVisualizer } from "../components/state-visualizer"
import { Toolbar } from "../components/toolbar"
import { useControls } from "../hooks/use-controls"

export default function Page() {
  const controls = useControls(filePickerControls)

  const [state, send] = useMachine(filePicker.machine({ id: createUniqueId() }), {
    context: controls.context,
  })

  const api = createMemo(() => filePicker.connect(state, send, normalizeProps))

  return (
    <>
      <main class="file-picker">
        <div {...api().rootProps}>
          <div {...api().dropzoneProps}>
            <input {...api().hiddenInputProps} />
            Drag your files here
          </div>

          <button {...api().triggerProps}>Choose Files...</button>

          <ul>
            <For each={api().files}>
              {(file) => {
                return (
                  <li class="file">
                    <div>
                      <b>{file.name}</b>
                    </div>
                    <div>{formatFileSize(file.size)}</div>
                    <div>{file.type}</div>
                    <button {...api().getDeleteTriggerProps({ file })}>X</button>
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
      </main>

      <Toolbar controls={controls.ui}>
        <StateVisualizer state={state} />
      </Toolbar>
    </>
  )
}
