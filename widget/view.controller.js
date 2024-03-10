/* Copyright start
    Copyright (C) 2008 - 2023 Fortinet Inc.
    All rights reserved.
    FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
    Copyright end */
/* Edit Status 
    author: Danny
    modified: 240324 */
'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('danny_playbook_c3_charts104Ctrl', danny_playbook_c3_charts104Ctrl);

    danny_playbook_c3_charts104Ctrl.$inject = ["$scope", "config", "websocketService", "FormEntityService", "API", "toaster", "$filter", "$resource"];

    function danny_playbook_c3_charts104Ctrl($scope, config, websocketService, FormEntityService, API, toaster, $filter, $resource) {
        $scope.config = config;
        $scope.refresh = refresh;

        $scope.chart_uid = "dpc3-" + crypto.randomUUID();
        $scope.chart_loading = true;

        // -------------------------------------------------------- playbook service start --------------------------------------------------------
        $scope.websocket_subscriptions = [];
        $scope.playbook_task_id = "";

        // getting the runningworkflow (playbook) by websocket
        function websocket_unsubscribe() {
            for (const _idx in $scope.websocket_subscriptions) {
                $scope.websocket_subscriptions[_idx].unsubscribe();
            }
            $scope.websocket_subscriptions = [];
        }

        function websocket_refresh() {
            websocket_unsubscribe();

            websocketService.subscribe("runningworkflow", function (_json_data) {
                load_json_by_playbook(_json_data);
                // this is the part when the data is recieved from runningworkflow something like json_data of an actual data
            }).then(function (_websocket_sub) {
                $scope.websocket_subscriptions.push(_websocket_sub);
                // this is the part when the websocket is subscribed an data is websocket "{id: 'sub-9', unsubscribe: ƒ}""
            });
        }
        websocket_refresh();


        $scope.$on("websocket:reconnect", function () {
            websocket_refresh();
        });


        function load_json_by_playbook(_json_data) {
            if (_json_data.task_id && $scope.playbook_task_id == _json_data.task_id && _json_data.status && "null" === _json_data.parent_wf) {
                if ("finished" === _json_data.status || "finished_with_error" === _json_data.status) {
                    checkPlaybookExecutionCompletion();
                }
                else if ("failed" === _json_data.status) {
                    toaster.warning({
                        body: "Playbook execution ended with 'failed' status. Please revise your playbook."
                    });
                    json_input_model_changed("Playbook execution ended with 'failed' status. Please revise your playbook.");

                    $scope.playbook_task_id = "";
                    $scope.json_loading = false;
                }
                else {
                    // playbook is in other state
                }
            }
        }


        function checkPlaybookExecutionCompletion() {
            if ($scope.playbook_task_id === "") {
                // when the playbook_task_id is "" it already has been processed
                return
            }

            $resource(API.WORKFLOW + "api/workflows/log_list/?format=json&parent__isnull=True&task_id=" + $scope.playbook_task_id)
                .save()
                .$promise
                .then(function (_response) {
                    if ($scope.playbook_task_id !== "") {
                        const status = _response["hydra:member"][0]["status"];
                        if ("finished" === status || "finished_with_error" === status) {
                            fetch_playbook_result(_response["hydra:member"][0]["@id"]);
                        }
                        else if ("failed" === status) {
                            toaster.warning({
                                body: "Playbook execution ended with 'failed' status. Please revise your playbook."
                            });
                            json_input_model_changed("Playbook execution ended with 'failed' status. Please revise your playbook.");

                            $scope.playbook_task_id = "";
                            $scope.json_loading = false;
                        }
                        else {
                            // playbook is in other state
                        }
                    }
                })
                .catch(function (_error) {
                    console.log(_error);
                });
        }


        function fetch_playbook_result(instance_id) {
            $resource("api" + instance_id + "?")
                .get({})
                .$promise
                .then(function (_response) {
                    if (_response["result"] && _response["result"]["data"]) {
                        json_input_model_changed(JSON.stringify(_response["result"]["data"]));
                        render_chart(JSON.stringify(_response["result"]["data"]));
                    }
                    else {
                        json_input_model_changed(JSON.stringify(_response["result"]));
                        toaster.warning({
                            body: `Playbook return must contain 'data' key as a result`
                        });
                    }

                    $scope.playbook_task_id = "";
                    $scope.json_loading = false; f
                })
                .catch(function (_error) {
                    toaster.warning({
                        body: `Playbook failed with error: ${_error}`
                    });
                    // json_input_model_changed(`Playbook failed with error: ${_error}`);

                    $scope.playbook_task_id = "";
                    $scope.json_loading = false;
                });
        }


        function execute_playbook(_playbook) {
            $scope.json_loading = true;

            const form_entity = FormEntityService.get();
            if (form_entity === undefined) {
                const api_endpoint = API.MANUAL_TRIGGER + _playbook.uuid;
                const input_data = {};

                $resource(api_endpoint)
                    .save(input_data)
                    .$promise
                    .then(function (_response) {
                        const task_ids = _response.task_id !== undefined ? [_response.task_id] : _response.task_ids;
                        $scope.playbook_task_id = task_ids[0];

                        checkPlaybookExecutionCompletion();
                    })
                    .catch(function (_error) {
                        console.log(_error);
                    });
            }
            else {
                const api_endpoint = API.ACTION_TRIGGER + $filter('getEndPathName')(_playbook.triggerStep);
                const input_data = {
                    "records": [form_entity["originalData"]["@id"]],
                    "__resource": form_entity.module,
                    "__uuid": _playbook.uuid,
                    "singleRecordExecution": true,
                };

                $resource(api_endpoint)
                    .save(input_data)
                    .$promise
                    .then(function (_response) {
                        const task_ids = _response.task_id !== undefined ? [_response.task_id] : _response.task_ids;
                        $scope.playbook_task_id = task_ids[0];

                        checkPlaybookExecutionCompletion();
                    })
                    .catch(function (_error) {
                        console.log(_error);
                    });
            }
        }
        // -------------------------------------------------------- playbook service end --------------------------------------------------------

        const form_entity = FormEntityService.get();
        if (form_entity !== undefined) {
            websocketService.subscribe(form_entity.module, function (data) {
                if (data.changeData) {
                    for (const key of data.changeData) {
                        if ($scope.config.selected_module_fields.some(obj => obj.name === key)) {
                            refresh();
                            break;
                        }
                    }
                }
            }).then(function (data) {
                websocket_subscriptions.push(data);
            });
        }


        function json_input_model_changed(json_input_model) {
            $scope.json_input_model = json_input_model;
        }


        function reload_user_input() {
            const jinja_editor_payload = {
                "template": $scope.config.json_input_model,
                "values": {}
            };
            for (const key in $scope.config.selected_module_fields) {
                const monitor_field = $scope.config.selected_module_fields[key];
                jinja_editor_payload["values"][monitor_field.name] = FormEntityService.get().fields[monitor_field.name].value;
            }

            $resource(API.WORKFLOW + "api/jinja-editor/?format=json")
                .save(JSON.stringify(jinja_editor_payload))
                .$promise
                .then(function (_response) {
                    json_input_model_changed(JSON.stringify(_response.result));
                    render_chart(JSON.stringify(_response.result));
                })
                .catch(function (_error) {
                    console.log(_error);
                });
        }


        function refresh() {
            if ($scope.config.render_method == "playbook") {
                execute_playbook($scope.config.selected_playbook);
            }
            else if ($scope.config.render_method == "user_input") {
                reload_user_input();
            }
        }
        refresh();


        function waitForElementAndExecuteFunction(elementId, callback, ...params) {
            const element = document.getElementById(elementId);

            if (element) {
                callback(...params);
            } else {
                setTimeout(() => {
                    waitForElementAndExecuteFunction(elementId, callback);
                }, 500);
            }
        }


        function render_chart(json_to_render) {
            waitForElementAndExecuteFunction($scope.chart_uid, _render_chart, json_to_render);
        }


        $scope.config.use_animation = true;
        function _render_chart(json_to_render) {
            // try catch for the exception in data
            const json_data = JSON.parse(json_to_render);
            if ($scope.chart_data && $scope.config.use_animation) {
                $scope.chart.load(json_data.data);
            }
            else {
                $scope.chart_data = json_data;
                $scope.chart_data["bindto"] = "#" + $scope.chart_uid;
                $scope.chart = c3.generate($scope.chart_data);
                $scope.chart_loading = false;
            }
        }


        function default_value_if_undefined(value, undefined_value) {
            if (value === undefined)
                return undefined_value
            return value
        }

        $scope.$on("$destroy", function () {
            websocket_unsubscribe();
            if ($scope.chart) {
                $scope.chart.destroy();
            }
        });
    }
})();
