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
    <td>
        <a class="btn" on:click={() => _onclick(station)}> {icon} </a>
    </td>
</tr>

<style>
    .icon {
      vertical-align: middle;
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
</style>
