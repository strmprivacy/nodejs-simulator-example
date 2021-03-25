import { Type } from "avsc";
import { Sender } from "@streammachine.io/nodejs-driver";
import {KioskEvent} from "@streammachine.io/schema-nps-unified/lib/io/streammachine/schemas/nps/unified/v1/KioskEvent";
import {Schema} from "avsc";
import * as assert from "assert";

/*
credentials.json is something like
{
    "billingId": "...", // via strm auth show
    "clientId": "...", // via strm streams create ...
    "clientSecret": "..." // same
}
 */

/*
Note: the working directory for ts-node is the `src` directory. Bah.
 */
let configFile = process.argv.length > 2 ? process.argv[2] : "../credentials.json"
console.info("Starting with configuration "+configFile);

const CONFIG = require(configFile);


if(CONFIG.stsUrl == undefined)
  CONFIG.stsUrl = "https://auth.strm.services"

if(CONFIG.gatewayUrl == undefined)
  CONFIG.gatewayUrl = "https://in.strm.services/event"


if(CONFIG.interval == undefined)
  CONFIG.interval = 100;

if(CONFIG.testDuration == undefined)
  CONFIG.testDuration = 1800;
console.info(`connecting to ${CONFIG.authUrl}, ${CONFIG.gatewayUrl}`)
console.info(`Sending an event every ${CONFIG.interval}ms for ${CONFIG.testDuration}s.`)


/* TODO this magic will go into the next version of the Stream Machine driver
 You'll only have to import the Stream Machine schema in the future
 */
// @ts-ignore
const SCHEMA_ID = KioskEvent.schema['namespace'].split(".").slice(3).join("_");
assert("nps_unified_v1" == SCHEMA_ID);
let SERIALIZATION_TYPE = Type.forSchema(<Schema>KioskEvent.schema);

async function delay(ms: number){
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function send1(sender: Sender, event: KioskEvent) {
  try {
    const r = await sender.send(event);
    if (r.status !== 204) {
      console.debug(`RESULT:`, r)
    }
  } catch (e) {
      console.error(`Error: ${e}`);
  }
}

async function startSender() {
    /*
     we need three parameters for the stream descriptor: billingId, clientId and secret.
     */

  const sender = new Sender({
      ...CONFIG,
      schemaId: SCHEMA_ID,
      type: SERIALIZATION_TYPE
  });

  // Make sure to listen for error events, otherwise Node does not handle the error events (they're escalated)
  sender.on("error", (error) => {
    console.error(`sender error ${error}`);
  });

  await sender.connect().catch(e => { console.error(`Connect error ${e}`); });

  let timer = setInterval(() => {
    send1(sender, EVENT());
  }, CONFIG.interval)


  await delay(CONFIG.testDuration * 1000);
  console.info("test is done")
  clearInterval(timer);
  console.info("disconnecting sender")

  await sender.disconnect();
}

function randomInt(i: number){
  return Math.floor(i*Math.random());
}

function randomString(s:string,i:number){
  return `${s}-${randomInt(i)}`
}

function pickRandom(strings: string[]){
  return strings[Math.floor(Math.random() * strings.length)]
}

let EVENT = () : KioskEvent => {
  let consentLevelOptions = [
      [0,1,5],
      [0,1],
      [7,3],
      [0],
      []
  ]
  let consentLevels = consentLevelOptions[Math.floor(Math.random()*consentLevelOptions.length)];
  return {
    schema(): object {
      // @ts-ignore
      return undefined;
    }, subject(): string {
      return "";
    },

    article_action: "",
    article_id: randomString("article", 1000),
    article_in_view: 10,
    article_rank: 1,
    article_title: "",
    brand_source: pickRandom(["", "Kiosk"]),
    consent_level: "", // TODO strmMeta.consentLevels is leading!
    customer_id: randomString("customer", 100),
    device_id: randomString("device", 100),
    followable_action: "",
    followable_clicked: true,
    followable_context: "",
    followable_id: randomString("followable-id", 100),
    followable_in_view: 20,
    followable_rank: 0,
    followable_title: "",
    followable_type: "",
    followable_type_value: false,
    os: "",
    platform: "",
    session_id: randomString("session", 100),
    swimlane_action: "",
    swimlane_header: "",
    swimlane_id: randomString("swimlane-id", 100),
    swimlane_in_view: 30,
    swimlane_rank: randomInt(10),
    version: "",
    strmMeta: {
      consentLevels: consentLevels
    }
  }
};

startSender();
