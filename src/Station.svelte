<script>
    export let station;
    export let _onclick;
    export let icon;
</script>

<li>
    <a href={station.homepage}>
        <img src={station.favicon} alt={station.name} class="icon"> 
        {station.name}
    </a><br>
    Format: {station.codec} {station.bitrate}, voted: {station.votes}
    <a class="btn" on:click={() => _onclick(station)}> {icon} </a>
</li>

<style>
    .icon {
      vertical-align: middle;
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
</style>
