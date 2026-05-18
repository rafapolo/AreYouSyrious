#!/bin/bash
export $(cat .env | xargs) && MEDIUM_COOKIE_SID=$sid ZMTM_TOS_ACCEPTED=1 ruby fetch.rb
