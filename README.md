# Simulates some events for Stream Machine

Note this demo is a developer preview.

# Create an account

Browse to [portal.streammachine.io](https://portal.streammachine.io) and create
an account.

# Download the cli

Browse to [cli
releases](https://github.com/streammachineio/cli/releases/latest) and
download the version appropriate to your Operating System. Place this somewhere
in your `$PATH`, and maybe rename it to `strm`.

Log in `strm auth login` and note your `billing-id` that you need for creating
streams:

    strm auth show
    Credentials for ...
    Billing id = ....


# Follow along with the documentation

Browse to [the documentation](https://docs.streammachine.io).

# Create a stream

    strm stream create <name>

This creates a Stream Machine stream, and gives you credentials, something
like

```
strm streams create demo
{
  "name": "demo", "tags": [],
  "credentials": {
    "clientId": "9yzvcb23clv...",
    "clientSecret": "4%VL8p$t1..."
  }
}
```

You need the credentials together with your `billing-id` if you want to send
data.

For the demonstration with Typescript, create file named `credentials.json`
with your billing-id, clientId and clientSecret in it.

    {
        "billingId": "...",
        "clientId": "...",
        "clientSecret": "..."
    }

You should be able to start sending data:

    npm i
    npm run sender

Note that you don't get any feedback when sending data if everything goes well.
The reason for this is that the Javascript driver and the Stream Machine gateway
are capable of handling very high loads, and logging events would very quickly
fill up log files.

Note: Stream Machine has extensive metrics dashboards, but these are
unfortunately not yet customer facing.

# Retrieving Data

The demo we gave shows events being sent in batches to AWS S3. Follow along with
the [S3 documentation](https://docs.streammachine.io/docs/0.1.0/quickstart/index.html) to create a
credentials file that Stream Machine can use to store events from your stream
into an S3 bucket that you control footnote:[we'll improve the documentation to
show how to give more restrictive access to S3]


Once the Sink has been set up, you need to create an _exporter_ that
periodically batches data into your sink. See the [documentation](https://docs.streammachine.io/docs/0.1.0/quickstart/creating-streams.html#_exporting_to_s3).

With the exporter created you should be able to see json lines files in your s3
bucket. Note: there is no mechanism yet to show exporter failures (permissions
for instance) of an exporter to the customer. Do *not hesitate* to go on the
[support channel](https://gitter.im/stream-machine/community) if there's
something not working as expected.

Greetings

Bart van Deenen, Robin Trietsch
