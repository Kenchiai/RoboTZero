import type { PanelContext, PanelHandle } from '../catalog';
import { createScene } from '../../render/scene';

export function mount(target: HTMLElement, context: PanelContext): PanelHandle {
  return createScene(target, context);
}
