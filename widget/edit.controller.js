/* Copyright start
    Copyright (C) 2008 - 2023 Fortinet Inc.
    All rights reserved.
    FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
    Copyright end */
/* Edit Status 
    author: Danny
    modified: 240324 */
"use strict";
(function () {
    angular
        .module("cybersponse")
        .controller("editDanny_playbook_c3_charts104Ctrl", editDanny_playbook_c3_charts104Ctrl);

    editDanny_playbook_c3_charts104Ctrl.$inject = ["$scope", "$uibModalInstance", "config", "Field", "API", "$resource", "FormEntityService", "Entity", "toaster", "websocketService", "$filter"];

    function editDanny_playbook_c3_charts104Ctrl($scope, $uibModalInstance, config, Field, API, $resource, FormEntityService, Entity, toaster, websocketService, $filter) {
        $scope.config = config;
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.refresh = refresh;
        $scope.chart_unload = chart_unload;
        
        $scope.container_uid = "dpc3-" + crypto.randomUUID();
        
        $scope.config.title = default_value_if_undefined($scope.config.title, "");
        $scope.title_field = new Field({
            "name": "title_field",
            "formType": "text",
            "title": "Title",
            "writeable": true,
            "validation": {
                "required": true
            }
        });
        
        $scope.config.render_method = default_value_if_undefined($scope.config.render_method, "");

        $scope.module_fields = [];
        // $scope.selected_module_field = default_value_if_undefined($scope.selected_module_field, "");
        $scope.config.selected_module_fields = default_value_if_undefined($scope.config.selected_module_fields, []);
        $scope.add_module_field_to_watch = add_module_field_to_watch;
        $scope.remove_module_field_to_watch = remove_module_field_to_watch;

        $scope.config.json_jinja_debug_model = default_value_if_undefined($scope.config.json_jinja_debug_model, "{}");
        $scope.json_jinja_debug_field = new Field({
            "name": "chart_jinja_values",
            "formType": "json",
            "title": "Chart Jinja Values",
            "writeable": true,
            "validation": {
                "required": true
            }
        });

        // $scope.config.selected_chart_type = default_value_if_undefined($scope.config.selected_chart_type, "");
        $scope.chart_type_changed = chart_type_changed;

        $scope.playbook_selection_collapsed = false;
        // $scope.config.selected_playbook = default_value_if_undefined($scope.config.selected_playbook, "");
        $scope.playbook_task = {};

        $scope.json_loading = false;
        $scope.json_input_collapsed = false;
        $scope.config.json_input_model = default_value_if_undefined($scope.config.json_input_model, "{}");
        $scope.json_input_field = new Field({
            "name": "chart_data",
            "formType": "json",
            "title": "Chart Data",
            "writeable": true,
            "validation": {
                "required": true
            }
        });

        $scope.render_chart = render_chart;
        $scope.chart_uid = "dpc3-" + crypto.randomUUID();


        $scope.$watch("config.render_method", function (newValue, oldValue) {
            switch (newValue) {
                case "user_input": {
                    $scope.json_loading = false;
                    // $scope.config.selected_chart_type = "";
                    break;
                }
                case "playbook": {
                    // $scope.config.selected_playbook = "";
                    break;
                }
            }
        });


        function refresh_module_fields() {
            const form_entity = FormEntityService.get();
            if (form_entity !== undefined) {
                const entity = new Entity(form_entity.module);

                entity.loadFields().then(function () {
                    for (var key in entity.fields) {
                        const module_field = entity.fields[key];
                        if ($scope.config.selected_module_fields.some(obj => obj.name === module_field.name)) {
                            $scope.config.selected_module_fields.splice($scope.config.selected_module_fields.findIndex(obj => obj.name === module_field.name), 1);
                            $scope.config.selected_module_fields.push(module_field);
                        }
                        else {
                            $scope.module_fields.push(module_field);
                        }
                    }
                });
            }
            else {
                // testing
                // const entity = new Entity("alerts");
                // entity.loadFields().then(function () {
                //     for (var key in entity.fields) {
                //         const module_field = entity.fields[key];
                //         if (!$scope.config.selected_module_fields.includes(module_field)) {
                //             $scope.module_fields.push(module_field);
                //         }
                //     }
                // });
            }
        }
        refresh_module_fields();


        function recreate_module_fields_as_json_jinja_debug_model(json_jinja_debug_model) {
            const form_entity = FormEntityService.get();
            if (form_entity !== undefined) {
                for (const idx in $scope.config.selected_module_fields) {
                    const module_field = $scope.config.selected_module_fields[idx];
                    if (form_entity !== undefined) {
                        json_jinja_debug_model[module_field.name] = form_entity.fields[module_field.name].value;
                    }
                    else {
                        json_jinja_debug_model[module_field.name] = "update_this_value";
                    }
                }
            }
        }


        function add_module_field_to_watch(selected_module_field) {
            $scope.config.selected_module_fields.push(selected_module_field);
            $scope.module_fields.splice($scope.module_fields.indexOf(selected_module_field), 1);

            const form_entity = FormEntityService.get();
            const json_jinja_debug_model = JSON.parse(validate_json_string($scope.config.json_jinja_debug_model, "{}", "error in validating 'Module Field Debug', refreshing all data..."));
            if (JSON.stringify(json_jinja_debug_model) === "{}") {
                recreate_module_fields_as_json_jinja_debug_model(json_jinja_debug_model);
            }
            else {
                if (json_jinja_debug_model[selected_module_field.name] === undefined) {
                    if (form_entity !== undefined) {
                        json_jinja_debug_model[selected_module_field.name] = default_value_if_undefined(form_entity.fields[selected_module_field.name].value, null);
                    }
                    else {
                        json_jinja_debug_model[selected_module_field.name] = "update_this_value";
                    }
                }
            }

            $scope.config.json_jinja_debug_model = JSON.stringify(json_jinja_debug_model);
            $scope.json_jinja_debug_field = new Field({
                "name": "chart_jinja_values",
                "formType": "json",
                "title": "Chart Jinja Values",
                "writeable": true,
                "validation": {
                    "required": true
                }
            });
        }


        function remove_module_field_to_watch($index) {
            const module_field = $scope.config.selected_module_fields[$index];
            $scope.module_fields.push(module_field);
            $scope.config.selected_module_fields.splice($scope.config.selected_module_fields.indexOf(module_field), 1);

            const json_jinja_debug_model = JSON.parse(validate_json_string($scope.config.json_jinja_debug_model, "{}", "error in validating 'Module Field Debug', refreshing all data..."));
            if (JSON.stringify(json_jinja_debug_model) === "{}") {
                recreate_module_fields_as_json_jinja_debug_model(json_jinja_debug_model);
            }
            else {
                if (json_jinja_debug_model[module_field.name] !== undefined) {
                    delete json_jinja_debug_model[module_field.name];
                    $scope.config.json_jinja_debug_model = JSON.stringify(json_jinja_debug_model);
                    $scope.json_jinja_debug_field = new Field({
                        "name": "chart_jinja_values",
                        "formType": "json",
                        "title": "Chart Jinja Values",
                        "writeable": true,
                        "validation": {
                            "required": true
                        }
                    });
                }
            }
        }


        function render_chart_types() {
            $scope.chart_types = [
                "line",
                "timeseries",
                "spline",
                "step",
                "area",
                "bar",
                "scatter",
                "pie",
                "donut",
                "gauge",
            ];
        }
        render_chart_types();

        function chart_type_changed() {
            $scope.chart_data = undefined;
            switch ($scope.config.selected_chart_type) {
                case "line": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 30, 200, 100, 400, 150, 250],
                                ["data2", 50, 20, 10, 40, 15, 25]
                            ],
                            type: "line"
                        }
                    }
                    break;
                }
                case "timeseries": {
                    $scope.config.json_input_model = {
                        data: {
                            x: "x",
                            columns: [
                                ["x", "2013-01-01", "2013-01-02", "2013-01-03", "2013-01-04", "2013-01-05", "2013-01-06"],
                                ["data1", 30, 200, 100, 400, 150, 250],
                                ["data2", 130, 340, 200, 500, 250, 350]
                            ]
                        },
                        axis: {
                            x: {
                                type: "timeseries",
                                tick: {
                                    format: "%Y-%m-%d"
                                }
                            }
                        }
                    }
                    break;
                }
                case "spline": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 30, 200, 100, 400, 150, 250],
                                ["data2", 130, 100, 140, 200, 150, 50]
                            ],
                            type: "spline"
                        }
                    }
                    break;
                }
                case "step": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 300, 350, 300, 0, 0, 100],
                                ["data2", 130, 100, 140, 200, 150, 50]
                            ],
                            types: {
                                data1: "step",
                                data2: "area-step"
                            }
                        }
                    }
                    break;
                }
                case "area": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 300, 350, 300, 0, 0, 0],
                                ["data2", 130, 100, 140, 200, 150, 50],
                                ["data3", 130, 100, 140, 200, 150, 50]
                            ],
                            types: {
                                data1: "area",
                                data2: "area-spline",
                                data3: "area-step"
                            }
                        }
                    }
                    break;
                }
                case "bar": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 30, 200, 100, 400, 150, 250],
                                ["data2", 130, 100, 140, 200, 150, 50]
                            ],
                            type: "bar"
                        },
                        bar: {
                            width: {
                                ratio: 0.5
                            }
                        }
                    }
                    break;
                }
                case "scatter": {
                    $scope.config.json_input_model = {
                        data: {
                            xs: {
                                setosa: "setosa_x",
                                versicolor: "versicolor_x",
                            },
                            // iris data from R
                            columns: [
                                ["setosa_x", 3.5, 3.0, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4, 3.0, 3.0, 4.0, 4.4, 3.9, 3.5, 3.8, 3.8, 3.4, 3.7, 3.6, 3.3, 3.4, 3.0, 3.4, 3.5, 3.4, 3.2, 3.1, 3.4, 4.1, 4.2, 3.1, 3.2, 3.5, 3.6, 3.0, 3.4, 3.5, 2.3, 3.2, 3.5, 3.8, 3.0, 3.8, 3.2, 3.7, 3.3],
                                ["versicolor_x", 3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2.0, 3.0, 2.2, 2.9, 2.9, 3.1, 3.0, 2.7, 2.2, 2.5, 3.2, 2.8, 2.5, 2.8, 2.9, 3.0, 2.8, 3.0, 2.9, 2.6, 2.4, 2.4, 2.7, 2.7, 3.0, 3.4, 3.1, 2.3, 3.0, 2.5, 2.6, 3.0, 2.6, 2.3, 2.7, 3.0, 2.9, 2.9, 2.5, 2.8],
                                ["setosa", 0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.3, 0.2, 0.2, 0.1, 0.2, 0.2, 0.1, 0.1, 0.2, 0.4, 0.4, 0.3, 0.3, 0.3, 0.2, 0.4, 0.2, 0.5, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2, 0.2, 0.4, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.2, 0.2, 0.3, 0.3, 0.2, 0.6, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2],
                                ["versicolor", 1.4, 1.5, 1.5, 1.3, 1.5, 1.3, 1.6, 1.0, 1.3, 1.4, 1.0, 1.5, 1.0, 1.4, 1.3, 1.4, 1.5, 1.0, 1.5, 1.1, 1.8, 1.3, 1.5, 1.2, 1.3, 1.4, 1.4, 1.7, 1.5, 1.0, 1.1, 1.0, 1.2, 1.6, 1.5, 1.6, 1.5, 1.3, 1.3, 1.3, 1.2, 1.4, 1.2, 1.0, 1.3, 1.2, 1.3, 1.3, 1.1, 1.3],
                            ],
                            type: "scatter"
                        },
                        axis: {
                            x: {
                                label: "Sepal.Width",
                                tick: {
                                    fit: false
                                }
                            },
                            y: {
                                label: "Petal.Width"
                            }
                        }
                    }
                    break;
                }
                case "pie": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 30],
                                ["data2", 120],
                            ],
                            type: "pie"
                        }
                    }
                    break;
                }
                case "donut": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data1", 30],
                                ["data2", 120],
                            ],
                            type: "donut"
                        },
                        donut: {
                            title: "Iris Petal Width"
                        }
                    }
                    break;
                }
                case "gauge": {
                    $scope.config.json_input_model = {
                        data: {
                            columns: [
                                ["data", 91.4]
                            ],
                            type: "gauge"
                        },
                        gauge: {
                            label: {
                                show: false // to turn off the min/max labels.
                            },
                            min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
                            max: 100, // 100 is default
                            units: "%",
                            width: 39 // for adjusting arc thickness
                        },
                        color: {
                            pattern: ["#FF0000", "#F97600", "#F6C600", "#60B044"], // the three color levels for the percentage values.
                            threshold: {
                                unit: "value", // percentage is default
                                max: 200, // 100 is default
                                values: [30, 60, 90, 100]
                            }
                        },
                        size: {
                            height: 180
                        }
                    }
                    break;
                }
                default: {
                    $scope.config.json_input_model = "{}";
                    break;
                }
            }
            render_chart_types();

            if ($scope.config.json_input_model !== "{}" && $scope.config.json_input_model !== "") {
                json_input_model_changed(JSON.stringify($scope.config.json_input_model));
                render_chart(JSON.stringify($scope.config.json_input_model));
            }
        }


        // -------------------------------------------------------- playbook service start --------------------------------------------------------
        $scope.$watch("config.selected_playbook", function (newValue, oldValue) {
            if ($scope.config.render_method === "playbook") {
                if (newValue !== "") {
                    $scope.chart_data = undefined;
                    execute_playbook(newValue);
                }
                if (!$scope.config.selected_playbook) {
                    json_input_model_changed("Select chart or playbook to render json data");
                }
            }
        });

        $scope.playbook_checking = false;
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
            if (_json_data.task_id && $scope.playbook_task_id === _json_data.task_id && _json_data.status && "null" === _json_data.parent_wf) {
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


        function json_input_model_changed(json_input_model) {
            $scope.config.json_input_model = json_input_model;

            // todo this has to be changed to update not keep the old one
            delete $scope.json_input_field;
            $scope.json_input_field = new Field({
                "name": "chart_data",
                "formType": "json",
                "title": "Chart Data",
                "writeable": true,
                "validation": {
                    "required": true
                }
            });
        }


        function reload_user_input() {
            const jinja_editor_payload = {
                "template": $scope.config.json_input_model,
                "values": {}
            };
            const json_jinja_debug_model = JSON.parse($scope.config.json_jinja_debug_model);
            for (const key in $scope.config.selected_module_fields) {
                const monitor_field = $scope.config.selected_module_fields[key];
                jinja_editor_payload["values"][monitor_field.name] = json_jinja_debug_model[monitor_field.name];
            }

            $resource(API.WORKFLOW + "api/jinja-editor/?format=json")
                .save(JSON.stringify(jinja_editor_payload))
                .$promise
                .then(function (_response) {
                    render_chart(JSON.stringify(_response.result));
                })
                .catch(function (_error) {
                    console.log(_error);
                });
        }


        function refresh() {
            if ($scope.config.render_method === "playbook") {
                execute_playbook($scope.config.selected_playbook);
            }
            else if ($scope.config.render_method === "user_input") {
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
            const json_data = JSON.parse(validate_json_string(json_to_render, "{}", "please re-create the 'Json Data'"));
            if ($scope.chart && $scope.chart_data && $scope.config.use_animation) {
                $scope.chart.load(json_data.data);
            }
            else {
                $scope.chart_data = json_data;
                $scope.chart_data["bindto"] = "#" + $scope.chart_uid;
                $scope.chart = c3.generate($scope.chart_data);
            }
        }


        function default_value_if_undefined(value, default_value) {
            if (value === undefined)
                return default_value
            return value
        }


        function validate_json_string(value, default_value, toaster_error) {
            try {
                JSON.parse(value);
                return value;
            }
            catch {
                toaster.error({
                    body: `${toaster_error}\noriginal data: ${value}`
                });
                return default_value
            }
        }


        function chart_unload() {
            $scope.chart.unload();
            $scope.chart = undefined;
            $scope.chart_data = undefined;
        }


        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }


        function save() {
            $uibModalInstance.close($scope.config);
        }


        $scope.$on("$destroy", function () {
            websocket_unsubscribe();
        })
    }
})();