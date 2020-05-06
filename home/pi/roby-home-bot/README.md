# roby-home-bot

Slack bot to control milights

Google Assistant -> IFTTT -> Slack -> RobyHomeBot -> Milights


## Configure IFTTT

Google Assistant
If You say "Turn the lights $", then Post a message to a Slack channel

Say a phrase with a text ingredient

What do you want the Assistant to say in response?
Sure thing boss. The lights will be $ .

Post to channel: general

Message: roby milight {{TextField}}
