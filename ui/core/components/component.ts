import { IDisposable } from "../IDisposable";

export abstract class Component {
	protected customRootElement?(): HTMLElement;

	private disposeCallbacks: Array<() => void> = [];
	private disposed: boolean = false;

	private toDispose = new Array<IDisposable>();

	readonly rootElem: HTMLElement;

	constructor(parentElem: HTMLElement | null, rootCssClass: string, rootElem?: HTMLElement) {
		this.rootElem = rootElem || this.customRootElement?.() || document.createElement('div');
		this.rootElem.classList.add(rootCssClass);
		if (parentElem) {
			parentElem.appendChild(this.rootElem);
		}
	}

	addOnDisposeCallback(callback: () => void) {
		this.disposeCallbacks.push(callback);
	}

	addDisposable(d: IDisposable) {
		this.toDispose.push(d);
	}

	dispose() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;

		this.disposeCallbacks.forEach(callback => callback());
		this.disposeCallbacks = [];

		this.toDispose.forEach(d => d.dispose());
		this.toDispose = [];
	}
}
