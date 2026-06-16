(function () {
  const api = {
    async getState() {
      const response = await fetch("/api/state");
      if (!response.ok) throw new Error("Cannot load online data");
      return response.json();
    },
    async saveState(nextState) {
      const headers = { "Content-Type": "application/json" };
      const pin = sessionStorage.getItem("torAssistantPin");
      if (pin) headers["x-tor-pin"] = pin;

      const response = await fetch("/api/state", {
        method: "PUT",
        headers,
        body: JSON.stringify(nextState),
      });

      if (response.status === 401) {
        const nextPin = prompt("ใส่รหัสแก้ไขระบบ");
        if (!nextPin) return;
        sessionStorage.setItem("torAssistantPin", nextPin);
        return api.saveState(nextState);
      }

      if (!response.ok) throw new Error("Cannot save online data");
    },
  };

  const localSaveState = saveState;

  saveState = function () {
    localSaveState();
    const status = $("savedState");
    if (status) status.textContent = "กำลังซิงก์ออนไลน์...";

    api.saveState(state)
      .then(() => {
        if (status) status.textContent = "บันทึกออนไลน์แล้ว";
      })
      .catch(() => {
        if (status) status.textContent = "บันทึกในเครื่องแล้ว";
      });
  };

  api
    .getState()
    .then((onlineState) => {
      if (!onlineState || typeof onlineState !== "object") return;
      state = { ...state, ...onlineState };
      syncFormFromState();
      if (state.current && state.current.analysis) renderAnalysis();
      renderPipeline();
      renderDocuments();
      const status = $("savedState");
      if (status) status.textContent = "โหลดข้อมูลออนไลน์แล้ว";
    })
    .catch(() => {
      const status = $("savedState");
      if (status) status.textContent = "ใช้ข้อมูลในเครื่อง";
    });
})();
