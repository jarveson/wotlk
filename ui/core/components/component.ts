
export interface IDisposable {
	dispose(): void;
}

export interface IDisposableContainer {
	addDisposable(disposable: IDisposable): void;
	dispose(): void;
}

export class DisposableContainer implements IDisposableContainer {
	private disposed: boolean = false;
	private toDispose: Array<IDisposable> = [];
	addDisposable(disposable: IDisposable) {
		this.toDispose.push(disposable);
	}
	dispose() {
		if (this.disposed)
			return;
		this.disposed = true;
		this.toDispose.forEach(d => d.dispose());
		this.toDispose = [];
	};
}

export abstract class Component implements IDisposableContainer {
	protected customRootElement?(): HTMLElement;

	private disposeCallbacks: Array<() => void> = [];
	private disposed: boolean = false;
	private toDispose: Array<IDisposable> = [];

	readonly rootElem: HTMLElement;

	constructor(parentElem: HTMLElement | null, rootCssClass: string, rootElem?: HTMLElement) {
		this.rootElem = rootElem || this.customRootElement?.() || document.createElement('div');
		this.rootElem.classList.add(rootCssClass);
		if (parentElem) {
			parentElem.appendChild(this.rootElem);
		}
	}

	addDisposable(disposable: IDisposable) {
		this.toDispose.push(disposable);
	}

	addOnDisposeCallback(callback: () => void) {
		this.disposeCallbacks.push(callback);
	}

	dispose() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;

		this.toDispose.forEach(d => d.dispose());
		this.toDispose = [];

		this.disposeCallbacks.forEach(callback => callback());
		this.disposeCallbacks = [];
	}
}
