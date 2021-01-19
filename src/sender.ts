import { Type } from "avsc";
import { Sender } from "@streammachine.io/nodejs-driver";
import {KioskEvent} from "@streammachine.io/schema-nps-unified/lib/io/streammachine/schemas/nps/unified/v1/KioskEvent";
import {Schema} from "avsc";
import * as assert from "assert";

/*
credentials-dev.json is something like
{
    "billingId": "...", // via strm auth show
    "clientId": "...", // via strm streams create ...
    "secret": "..." // same
}
 */

const CREDENTIALS = require("../credentials-dev.json");
/* TODO this magic will go into the next version of the Stream Machine driver
 You'll only have to import the Stream Machine schema in the future
 */
const SCHEMA_ID = KioskEvent.schema['namespace'].split(".").slice(3).join("_");
assert("nps_unified_v1" == SCHEMA_ID);
let SERIALIZATION_TYPE = Type.forSchema(<Schema>KioskEvent.schema);

async function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function send1(sender, event) {
  try {
    const r = await sender.send(event);
    if (r.status !== 204) {
      console.debug(`RESULT:`, r)
    }
  } catch (e) {
      console.error(e);
  }
}

async function startSender() {
    /* authUrl and apiUrl default to the Stream Machine production endpoints in
     strm.services. They only need to be set when you're connecting to
     non-production developer endpoints.

     we need three parameters for the stream descriptor: billingId, clientId and secret.
     */

  const sender = new Sender({
      ...CREDENTIALS,
      apiUrl: "https://in.strm.services/event",
      authUrl: "https://auth.strm.services",
      schemaId: SCHEMA_ID,
      type: SERIALIZATION_TYPE
  });

  // Make sure to listen for error events, otherwise Node does not handle the error events (they're escalated)
  sender.on("error", (error) => {
    console.error(`sender error ${error}`);
  });

  await sender.connect().catch(e => { console.error(`Connect error ${e}`); });

  setInterval(() => {
    send1(sender, EVENT());
  }, 300)
    // run for half an hour
  await delay(18000000);


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
      return undefined;
    }, subject(): string {
      return "";
    },

    article_action: "",
    article_id: randomString("article", 1000),
    article_in_view: 10,
    article_rank: 1,
    article_title: "",
    brand_source: pickRandom([null, "Kiosk"]),
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
