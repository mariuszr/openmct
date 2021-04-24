/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div style="
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
">
    <div class="">
        <label for="longitude">
            <div class="c-labeled-input__label">Longitude</div>
        </label>
        <input
            id="longitude"
            v-model="input.lon"
            type="text"
        >
        <label for="latitude">
            <div class="c-labeled-input__label">Latitude</div>
        </label>
        <input
            id="latitude"
            v-model="input.lat"
            type="text"
        >
        <button
            class="c-button c-button--major"
            @click="zoomMap(input)"
        >
            GO
        </button>
        <ul>
            <li
                v-for="(point, index) in points"
                :key="index"
                @click="zoomMap(point)"
            >
                Layer: {{ point.layerName }} - Longitude, Latitude {{ point.lon }}, {{ point.lat }}
            </li>
        </ul>
        <div
            v-if="hasLastPoint"
        >
            Last Point from Map - Layer: {{ lastPoint.layerName }} - Longitude, Latitude {{ lastPoint.lon }}, {{ lastPoint.lat }}
        </div>

        <div>
            <button
                v-if="!isRoverMoving"
                class="c-button c-button--major"
                @click="moveRover()"
            >
                START ROVER
            </button>
            <button
                v-else
                class="c-button c-button--major"
                @click="stopRover()"
            >
                STOP ROVER
            </button>
        </div>
    </div>
    <div
        class="l-iframe"
        style="
            height: 100%;
            width: auto;
        "
    >
        <iframe
            :src="domainObject.url"
            :name="key"
        ></iframe>
    </div>
</div>
</template>

<script>
import { testRoverWaypoints } from './roverWaypoints';

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            input: {
                layerName: '',
                lon: '',
                lat: ''
            },
            lastPoint: {
                layerName: undefined,
                lon: undefined,
                lat: undefined
            },
            points: [],
            isRoverMoving: false,
            currentRoverWaypoint: 0,
            roverIntervalId: undefined
        };
    },
    computed: {
        key() {
            return this.openmct.objects.makeKeyString(this.domainObject.identifier);
        },
        hasLastPoint() {
            return this.lastPoint.layerName !== undefined
                && this.lastPoint.lon !== undefined
                && this.lastPoint.lat !== undefined;
        }
    },
    destroyed() {
        window.removeEventListener('message', this.handleMessage);
    },
    mounted() {
        this.mmgis = window.frames[this.key];

        window.addEventListener('message', this.setLastPoint);
    },
    methods: {
        zoomMap(point) {
            this.postMessage(point);
        },
        setLastPoint(event) {
            const { origin, data } = event;
            const { layerName, lon, lat } = data;

            if (origin !== this.domainObject.url) {
                console.warn(`Message received from unknown origin: ${origin}`);
            }

            this.lastPoint = Object.assign(
                {},
                this.lastPoint,
                {
                    layerName: layerName,
                    lon: lon,
                    lat: lat
                }
            );

            this.savePoint(this.lastPoint);
        },
        savePoint(point) {
            const pointExists = this.points.some(existingPoint => {
                return point.lat === existingPoint.lat
                    && point.lon === existingPoint.lon
                    && point.layerName === existingPoint.layerName;
            });

            if (!pointExists) {
                this.points.push(point);
            }
        },
        postMessage(message) {
            // target.postMessage(message, this.domainObject.url);
            this.mmgis.postMessage(message, '*');
},
        clearLastPoint() {
            this.lastPoint.layerName = undefined;
            this.lastPoint.lon = undefined;
            this.lastPoint.lat = undefined;
        },
        moveRover() {
            this.isRoverMoving = true;

            this.roverIntervalId = window.setInterval(() => {
                if (this.currentRoverWaypoint >= testRoverWaypoints.length) {
                    this.currentRoverWaypoint = 0;
                }

                // this.skipWaypointsIfOutOfBounds();

                this.postMessage(testRoverWaypoints[this.currentRoverWaypoint]);

                this.currentRoverWaypoint += 1;
            }, 500);
        },
        skipWaypointsIfOutOfBounds() {
            const longituteBounds = [137.36759156, 137.37300222];
            const latitudeBounds = [-4.66408400, -4.66945736];

            while (testRoverWaypoints[this.currentRoverWaypoint].lon > longituteBounds[1]
                || testRoverWaypoints[this.currentRoverWaypoint].lon < longituteBounds[0]
                || testRoverWaypoints[this.currentRoverWaypoint].lat > latitudeBounds[1]
                || testRoverWaypoints[this.currentRoverWaypoint].lat < latitudeBounds[0]
            ) {
                this.currentRoverWaypoint += 1;
            }
        },
        stopRover() {
            window.clearInterval(this.roverIntervalId);

            this.isRoverMoving = false;
        }
    }
};
</script>
