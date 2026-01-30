# Sound Multilateration System
This project is a distributed system for locating the position of an unknown sound source using time-difference-of-arrival (TDOA) multilateration.
It consists of four remote listening stations that detect acoustic events and report timestamped measurements to a central server, which computes the estimated source location.

## System Architecture
Listening Stations (×4)
Each listening station is designed to operate автономously in the field and includes:
Raspberry Pi Zero (local processing + networking)
Arduino Nano (sensor/microcontroller support)
Microphone input (sound event capture)
GPS receiver (precise timing + station coordinates)
4G modem connectivity (remote deployment)
Solar-powered operation

## Central Server
A cloud-hosted Ubuntu VPS coordinates the stations and performs multilateration calculations.
Responsibilities include:
Collecting station timing reports
Running multilateration algorithms
Sending station instructions/configuration updates
(Planned) providing a live visualization dashboard

## Current Status
Work in Progress
One listening station is currently deployed and operational
Running on solar power with a Netgear MR1100 LTE modem
Remaining three stations will be built after reliability testing and bug fixes

## Roadmap
Planned next steps:
Complete deployment of all four stations
Improve sound event synchronization and filtering
Add real-time mapping interface for estimated source location
Field testing with real-world acoustic sources

## Motivation
This project is part of a broader effort to build real-world distributed sensing systems combining embedded hardware, networking, and full-stack software.

## License
(to be added)
