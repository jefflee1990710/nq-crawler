const axios = require('axios').default
const moment = require('moment-timezone')
const fs = require('fs');
const { parse } = require('json2csv');

let getEndpoint = (lastUnix=1893456000, dayStr) => {
    return `https://newsquawk.com/headlines.json?search[tag_query_matches][tag_ids]=&saved_search[name]=&search[published_before_by_day]=${dayStr}&search[tag_query_matches][operator]=OR&auto_complete=&search[updated_since][sequence]=0&search[updated_since][delay]=0&search[updated_since][first_published]=Infinity&search[updated_since][last_published]=${lastUnix}&_=${new Date().getTime()}`
}

let getLastUnixFromResult = (rows) => {
    let unix = 1000000000000000
    for(row of rows){
        if(row['published_at'].unix < unix){
            unix = row['published_at'].unix
        } 
    }
    return unix
}

let downloadData = async (dayStr) => {
    let all = []
    let lastUnix = 1893456000
    let stop = false

    let minus1DayStr = moment(dayStr, "YYYY-MM-DD").subtract(1, "days").format("YYYY-MM-DD");
    let minus2DayStr = moment(dayStr, "YYYY-MM-DD").subtract(2, "days").format("YYYY-MM-DD");
    let minus3DayStr = moment(dayStr, "YYYY-MM-DD").subtract(3, "days").format("YYYY-MM-DD");
    let plus1DayStr = moment(dayStr, "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");

    console.log("+- 1 days : ", minus1DayStr, plus1DayStr, "target -> ", dayStr)

    while(!stop){
        let endpoint = getEndpoint(lastUnix, plus1DayStr)
        console.log("Calling endpoint : ", endpoint)
        console.log("lastUnix : ", lastUnix)
        let resp = await axios.get(endpoint)
        let rows = resp.data
        lastUnix = getLastUnixFromResult(rows)
        console.log("Found lastUnix : ", lastUnix)
        for(row of rows){
            
            let time = moment(row['published_at'].iso_8601)
            row['hk_time'] = time.tz("Hongkong").format("YYYY-MM-DD HH:mm:ss")
            row['gmt_time'] = time.utc().format("YYYY-MM-DD HH:mm:ss")
            
            console.log('Downloading data (saved?) : ', row['published_at'].unix, time, "Save? : ", dayStr === time.format("YYYY-MM-DD"), "\n", row.subject)

            if(time.format("YYYY-MM-DD") === minus1DayStr || time.format("YYYY-MM-DD") === minus2DayStr || time.format("YYYY-MM-DD") === minus3DayStr){
                stop = true
                break;
            }else{
                if(dayStr === time.format("YYYY-MM-DD")){
                    all.push(row)
                }
            }
        }
    }
    return all
}

let main = async () => {

    var a = moment('2018-11-01');
    var b = moment('2018-12-31');

    // If you want an exclusive end date (half-open interval)
    for (var m = moment(a); m.isBefore(b); m.add(1, 'days')) {
        let dStr = m.format('YYYY-MM-DD');
        console.log("::: Start downloading data from : ", dStr)

        let rows = await downloadData(dStr)
        console.log('Number of rows downloaded : ', rows.length)
        let csv = parse(rows, {
            fields : [
                "gmt_time",
                "hk_time",
                "subject"
            ]
        })
        fs.writeFileSync(`./download/${dStr}.json`, JSON.stringify(rows, null, 4))
        fs.writeFileSync(`./download/${dStr}.csv`, csv)
    }

}


main().then(() => {}).catch((err) => {
    console.log(err)
})