<script>
    import Station from './Station.svelte';
    const search_url = 'https://de1.api.radio-browser.info/json/stations/search'

    const m3u_header = "#EXTM3U"
    const m3u_entry = (station) => `#EXTINF:-1, ${station.name}\n${station.url}`

    const generate_playlist = () => [m3u_header, ...stations_selected.map(m3u_entry)].join("\n")
    const queryString = (params) => "?" + Object.keys(params).map(key => key + '=' + params[key]).join('&')
    const fullUrl = (params) => search_url + queryString(params)
 
    let name = '';
    let m3u_list = [];
    let stations_selected = []
    let stations_downloaded = []

    async function handleSubmit () {
        const res = await fetch(
            fullUrl({ name: name, order: "votes", reverse: true}),
            { method: 'GET', }
        )
        stations_downloaded = await res.json()
    }

    const deleteItem = selectedStation => {
      stations_selected = stations_selected.filter(station => station.stationuuid !== selectedStation.stationuuid);
    };
    const addItem = station => {
      deleteItem(station)
      stations_selected.push(station);
      stations_selected = stations_selected
    };
    const download_generator = () => {
      var result = generate_playlist()
      var blob = new Blob([result]);
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
      } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        var hiddenElement = window.document.createElement("a");
        hiddenElement.href = "data:text/m3u;charset=utf-8," + encodeURI(result);
        hiddenElement.target = "_blank";
        hiddenElement.download = fileName;
        hiddenElement.click();
      } else {
        let link = document.createElement("a");
        if (link.download !== undefined) {
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "playlist.m3u");
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    };


</script>

<div class="row">
    <div class="column-3"></div>
    <div class="column-3">
        <h1>Radio playlist generator</h1>
    </div>
    <div class="column-3"></div>
</div>

<div class="row">
    <div class="column-2">
        <h2>Search stations</h2>
        <form on:submit|preventDefault={handleSubmit}>
            <input bind:value={name}>
            <button disabled={!name} type=submit>
                Submit
            </button>
        </form>
        {#if stations_downloaded.length}
        <table>
            <thead>
                <tr>
                    <th>
                        Name
                    </th>
                    <th>
                        Codec
                    </th>
                    <th>
                        Bitrate
                    </th>
                    <th>
                        Votes
                    <th>
                        Add
                    </th>
                </tr>
            </thead>
            <tbody>
                    {#each stations_downloaded as station}
                        <Station station={station} _onclick={addItem} icon="&rarr;"/>
                    {/each}
            </tbody>
        </table>
        {/if}
    </div>
    <div class="column-2">
        {#if stations_selected.length}
        <h2>Selected stations</h2>
        <button on:click="{download_generator}">
            Download
        </button>
        <table>
            <thead>
                <tr>
                    <th>
                        Name
                    </th>
                    <th>
                        Codec
                    </th>
                    <th>
                        Bitrate
                    </th>
                    <th>
                        Votes
                    <th>
                        Add
                    </th>
                </tr>
            </thead>
            <tbody>
                {#each stations_selected as station}
                    <Station station={station} _onclick={deleteItem} icon="&#9249;"/>
                {/each}
            </tbody>
        </table>
        {/if}
    </div>
</div>
