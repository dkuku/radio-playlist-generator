<script>
    export let station;
    export let _onclick;
    export let icon;
</script>

<tr>
    <td>
        <a href={station.homepage}>
            <img src={station.favicon} class="icon"> 
            {station.name}
        </a>
    </td>
    <td>
        {station.codec}
    </td>
    <td>
        {station.bitrate}
    </td>
    <td>
        {station.votes}
    </td>
    <td>
        {station.url}
        <a href={station.url} class="btn tooltip" target="_blank" data-tooltip="Play in new window"> &#9658; </a>
    </td>
    <td>
        <a href="#" class="btn tooltip" data-tooltip="send to playlist" on:click={() => _onclick(station)}> {icon} </a>
    </td>
</tr>

<style>
    .icon {
      vertical-align: middle;
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
    a.tooltip {
      position: relative ;
    }
    a.tooltip:hover::after {
      position: absolute ;
      content: attr(data-tooltip) ;
      top: 1.1em ;
      left: 1em ;
      min-width: 200px ;
      border: 1px #808080 solid ;
      padding: 8px ;
      color: black ;
      background-color: #cfc ;
      z-index: 1 ;
    }
</style>
