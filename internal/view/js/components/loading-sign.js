export function LoadingSign() {
	function renderView(vnode) {
		return m("i.fas.fa-fw.fa-spin.fa-spinner", {
			class: vnode.attrs.class
		})
	}

	return {
		view: renderView
	}
}