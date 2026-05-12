(function(){
  function toUTCDateFromLocalInput(value){
    if (!value) return new Date();
    const [ymd, hm] = value.split('T');
    const [Y,M,D] = ymd.split('-').map(n=>parseInt(n,10));
    const [h,m]   = (hm||'00:00').split(':').map(n=>parseInt(n,10));
    return new Date(Date.UTC(Y, (M||1)-1, D||1, h||0, m||0, 0, 0));
  }
  function julianDayUTC(d){ return d.getTime() / 86400000 + 2440587.5; }
  function fmtDateUTC(d){
    const pad = n => String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  // 🔁 Chemin corrigé vers le endpoint public
  async function fetchPlanetElements(dateISO){
    const url = `api/planets_jpl.php?date=${encodeURIComponent(dateISO)}`;
    console.debug('[JPL] GET', url);
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error(`JPL planets HTTP ${r.status}`);
    return r.json();
  }

  window.__timeRef = { epochUTC: new Date(), epochJD: null };
  window.PLANET_ELEM = {};
  window.PLANET_ELEM_READY = Promise.resolve();

  document.addEventListener('DOMContentLoaded', ()=>{
    const epochInput = document.getElementById('epochInput');
    const btnNow = document.getElementById('btnEpochNow');
    const btnSync = document.getElementById('btnSyncEpoch');
    const jdLabel = document.getElementById('jdLabel');

    function setNow(){
      const now = new Date();
      const pad = n => String(n).padStart(2,'0');
      const localISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      if (epochInput) epochInput.value = localISO;
    }
    function updateJDLabel(){
      if (!jdLabel) return;
      const jd = julianDayUTC(window.__timeRef.epochUTC);
      jdLabel.textContent = `JD ${jd.toFixed(5)} (UTC ${fmtDateUTC(window.__timeRef.epochUTC)})`;
    }

    if (btnNow) btnNow.addEventListener('click', (e)=>{ e.preventDefault(); setNow(); });
    if (epochInput && !epochInput.value) setNow();

	async function syncNow(){
	  try {
		const dUTC = toUTCDateFromLocalInput(epochInput?.value);
		window.__timeRef.epochUTC = dUTC;
		window.__timeRef.epochJD  = julianDayUTC(dUTC);
		updateJDLabel();

		const isoUTC = fmtDateUTC(dUTC); // ✅ "YYYY-MM-DD HH:MM" en UTC

		window.PLANET_ELEM_READY = fetchPlanetElements(isoUTC).then(json=>{
		  window.PLANET_ELEM = json || {};
		  document.dispatchEvent(new CustomEvent('planets:elements',{detail:{when: dUTC}}));
		}).catch(err=>{
		  console.warn('Planets JPL load failed:', err);
		});
		await window.PLANET_ELEM_READY;
	  } catch (err) {
		console.warn(err);
	  }
	}

    if (btnSync) btnSync.addEventListener('click', (e)=>{ e.preventDefault(); syncNow(); });
    // Premier sync au chargement
    syncNow();
  });
})();
