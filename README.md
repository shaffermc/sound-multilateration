# Sound Multilateration System

This is a system for finding the location of a sound source using the principles of multilateration. 
The system consists of 4 listening stations and a central server that the listening stations report to and take instructions from. 
Each listening station consists of a Raspberry Pi Zero, Arduino Nano, 4G modem, microphone, GPS receiver.
The central server is a Virtual Private Server running Ubuntu OS. 

This repository is a work in progress. Currently there is one listening station in operation. It is running off solar power and 
communicating using a Netgear MR1100 4G modem. Once all of the bugs have been worked out, the other three listening stations will
be built and the sound source location can be tested. 
