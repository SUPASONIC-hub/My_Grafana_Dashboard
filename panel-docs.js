window.panelDocumentation = {
  "1-1": {
    "title": "1-1. 플랫폼별 세션 비중 (Session Share by Platform)",
    "query": "WITH\r\n`기준데이터` AS (\r\n  SELECT\r\n    multiIf(\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`'), '웹',\r\n      lower(`플랫폼`) = '`IOS`', 'IOS',\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`'), 'AOS',\r\n      '기타'\r\n    ) AS `플랫폼_그룹`,\r\n    `세션_ID`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`서버_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n`플랫폼_세션수` AS (\r\n  SELECT\r\n    `플랫폼_그룹`,\r\n    countDistinct(`세션_ID`) AS `세션수`\r\n  FROM `기준데이터`\r\n  WHERE `플랫폼_그룹` IN ('웹', 'IOS', 'AOS')\r\n  GROUP BY `플랫폼_그룹`\r\n),\r\n`전체` AS (\r\n  SELECT sum(`세션수`) AS `전체_세션수`\r\n  FROM `플랫폼_세션수`\r\n)\r\nSELECT\r\n  `플랫폼`,\r\n  `세션수`,\r\n  round(`세션수` / nullIf(`전체_세션수`, 0) * 100, 2) AS `세션_비율`\r\nFROM\r\n(\r\n  SELECT\r\n    `플랫폼_그룹` AS `플랫폼`,\r\n    `세션수`,\r\n    `전체_세션수`\r\n  FROM `플랫폼_세션수`\r\n  CROSS JOIN `전체`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    '전체' AS `플랫폼`,\r\n    `전체_세션수` AS `세션수`,\r\n    `전체_세션수`\r\n  FROM `전체`\r\n)\r\nORDER BY\r\n  multiIf(`플랫폼` = '전체', 0, `플랫폼` = '웹', 1, `플랫폼` = 'IOS', 2, `플랫폼` = 'AOS', 3, 4);",
    "panelSpec": {
      "kind": "Panel",
      "id": 1,
      "title": "1-1. 플랫폼별 세션 비중 (Session Share by Platform)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 0,
        "y": 0,
        "w": 9,
        "h": 7,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "table",
      "queryCount": 3,
      "columns": [
        "`플랫폼`",
        "`세션수`",
        "`세션_비율`"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "green"
              },
              {
                "value": 100,
                "color": "blue"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`플랫폼`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "플랫폼"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`세션수`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "세션 수"
              },
              {
                "id": "unit",
                "value": "none"
              },
              {
                "id": "decimals",
                "value": 0
              },
              {
                "id": "min"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`세션_비율`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "비율"
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "color",
                "value": {
                  "mode": "thresholds"
                }
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "1-2": {
    "title": "1-2. 플랫폼별 평균 세션 체류시간 (Average Session Duration by Platform)",
    "query": "WITH\r\n`세션_기준데이터` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n    multiIf(\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`'), '웹',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) = '`IOS`', 'IOS',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`AOS`', '`안드로이드`'), 'AOS',\r\n      '기타'\r\n    ) AS `플랫폼_그룹`,\r\n    dateDiff('second', min(`클라이언트_시각`), max(`클라이언트_시각`)) AS `체류시간_초`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY\r\n    `사용자_ID`,\r\n    `세션_ID`\r\n),\r\n\r\n`유효_세션수` AS (\r\n  SELECT\r\n    *\r\n  FROM `세션_기준데이터`\r\n  WHERE `플랫폼_그룹` IN ('웹', 'IOS', 'AOS')\r\n),\r\n\r\n`플랫폼_행목록` AS (\r\n  SELECT\r\n    `플랫폼_그룹` AS `플랫폼`,\r\n\r\n    sum(`체류시간_초`) AS `전체_체류시간_초`,\r\n\r\n    round(avgIf(`체류시간_초`, `체류시간_초` BETWEEN 1 AND 1800), 2) AS `평균_체류시간_초`,\r\n    quantileIf(0.5)(`체류시간_초`, `체류시간_초` BETWEEN 1 AND 1800) AS `중앙값_체류시간_초`,\r\n\r\n    round(\r\n      sum(`체류시간_초`)\r\n      / nullIf((SELECT sum(`체류시간_초`) FROM `유효_세션수`), 0)\r\n      * 100,\r\n      2\r\n    ) AS `체류시간_비율`\r\n  FROM `유효_세션수`\r\n  GROUP BY `플랫폼_그룹`\r\n),\r\n\r\n`전체_행` AS (\r\n  SELECT\r\n    '전체' AS `플랫폼`,\r\n\r\n    sum(`체류시간_초`) AS `전체_체류시간_초`,\r\n\r\n    round(avgIf(`체류시간_초`, `체류시간_초` BETWEEN 1 AND 1800), 2) AS `평균_체류시간_초`,\r\n    quantileIf(0.5)(`체류시간_초`, `체류시간_초` BETWEEN 1 AND 1800) AS `중앙값_체류시간_초`,\r\n\r\n    100.00 AS `체류시간_비율`\r\n  FROM `유효_세션수`\r\n)\r\n\r\nSELECT\r\n  `플랫폼`,\r\n  `전체_체류시간_초`,\r\n  `평균_체류시간_초`,\r\n  `중앙값_체류시간_초`,\r\n  `체류시간_비율`\r\nFROM\r\n(\r\n  SELECT * FROM `전체_행`\r\n  UNION ALL\r\n  SELECT * FROM `플랫폼_행목록`\r\n)\r\nORDER BY multiIf(\r\n  `플랫폼` = '전체', 0,\r\n  `플랫폼` = '웹', 1,\r\n  `플랫폼` = 'IOS', 2,\r\n  `플랫폼` = 'AOS', 3,\r\n  4\r\n);",
    "panelSpec": {
      "kind": "Panel",
      "id": 2,
      "title": "1-2. 플랫폼별 평균 세션 체류시간 (Average Session Duration by Platform)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 9,
        "y": 0,
        "w": 15,
        "h": 7,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "`플랫폼`",
        "`전체_체류시간_초`",
        "`평균_체류시간_초`",
        "`중앙값_체류시간_초`",
        "`체류시간_비율`"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false,
            "hideFrom": {
              "viz": false
            },
            "styleField": "`체류시간_비율`"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "green"
              },
              {
                "value": 100,
                "color": "blue"
              }
            ]
          },
          "color": {
            "mode": "thresholds",
            "fixedColor": "transparent"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`플랫폼`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "플랫폼"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`전체_체류시간_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "총 체류시간"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`평균_체류시간_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "평균 세션 체류시간"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`중앙값_체류시간_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "세션 체류시간 중앙값"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`체류시간_비율`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "비율"
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "gradient",
                  "type": "color-background"
                }
              },
              {
                "id": "color"
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm",
        "sortBy": [
          {
            "desc": true,
            "displayName": "플랫폼"
          }
        ]
      },
      "transformations": []
    }
  },
  "1-3": {
    "title": "1-3. 시간별 활성 세션 추이 (Traffic Trend)",
    "query": "SELECT\r\n  toStartOfHour(`세션_start`) AS `시간`,\r\n  count() AS \"활성 세션 수\"\r\nFROM (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n    min(`클라이언트_시각`) AS `세션_start`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY\r\n    `사용자_ID`,\r\n    `세션_ID`\r\n)\r\nGROUP BY `시간`\r\nORDER BY `시간`",
    "panelSpec": {
      "kind": "Panel",
      "id": 7,
      "title": "1-3. 시간별 활성 세션 추이 (Traffic Trend)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 0,
        "y": 7,
        "w": 24,
        "h": 13,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "timeseries",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "drawStyle": "line",
            "lineInterpolation": "linear",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "lineWidth": 2,
            "fillOpacity": 10,
            "gradientMode": "none",
            "spanNulls": false,
            "insertNulls": false,
            "showPoints": "auto",
            "showValues": false,
            "pointSize": 5,
            "stacking": {
              "mode": "none",
              "group": "A"
            },
            "axisPlacement": "auto",
            "axisLabel": "",
            "axisColorMode": "text",
            "axisBorderShow": false,
            "scaleDistribution": {
              "type": "linear"
            },
            "axisCenteredZero": false,
            "hideFrom": {
              "tooltip": false,
              "viz": false,
              "legend": false
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "color": {
            "mode": "palette-classic"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": []
      },
      "options": {
        "tooltip": {
          "mode": "multi",
          "sort": "none",
          "hideZeros": false
        },
        "legend": {
          "showLegend": true,
          "displayMode": "list",
          "placement": "bottom",
          "calcs": []
        },
        "annotations": {
          "multiLane": false,
          "clustering": -1
        }
      },
      "transformations": []
    }
  },
  "1-4": {
    "title": "1-4. 플랫폼별 세션당 평균 PV (Average Page Views per Session by Platform)",
    "query": "WITH\r\n`기준데이터` AS (\r\n  SELECT\r\n    multiIf(\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`'), '웹',\r\n      lower(`플랫폼`) = '`IOS`', 'IOS',\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`'), 'AOS',\r\n      '기타'\r\n    ) AS `플랫폼_그룹`,\r\n    `세션_ID`,\r\n    `이벤트_유형`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`유효_기준데이터` AS (\r\n  SELECT\r\n    *\r\n  FROM `기준데이터`\r\n  WHERE `플랫폼_그룹` IN ('웹', 'IOS', 'AOS')\r\n),\r\n\r\n`플랫폼_행목록` AS (\r\n  SELECT\r\n    `플랫폼_그룹` AS `플랫폼`,\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `pv_수`,\r\n    countDistinct(`세션_ID`) AS `세션수`,\r\n    round(\r\n      countIf(`이벤트_유형` = '`페이지조회`')\r\n      / nullIf(countDistinct(`세션_ID`), 0),\r\n      2\r\n    ) AS `평균_pv_per_세션`,\r\n    round(\r\n      countIf(`이벤트_유형` = '`페이지조회`')\r\n      / nullIf(\r\n          (\r\n            SELECT countIf(`이벤트_유형` = '`페이지조회`')\r\n            FROM `유효_기준데이터`\r\n          ),\r\n          0\r\n        )\r\n      * 100,\r\n      2\r\n    ) AS `pv_비율`\r\n  FROM `유효_기준데이터`\r\n  GROUP BY `플랫폼_그룹`\r\n),\r\n\r\n`전체_행` AS (\r\n  SELECT\r\n    '전체' AS `플랫폼`,\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `pv_수`,\r\n    countDistinct(`세션_ID`) AS `세션수`,\r\n    round(\r\n      countIf(`이벤트_유형` = '`페이지조회`')\r\n      / nullIf(countDistinct(`세션_ID`), 0),\r\n      2\r\n    ) AS `평균_pv_per_세션`,\r\n    100.00 AS `pv_비율`\r\n  FROM `유효_기준데이터`\r\n)\r\n\r\nSELECT\r\n  `플랫폼`,\r\n  `pv_수`,\r\n  `세션수`,\r\n  `평균_pv_per_세션`,\r\n  `pv_비율`\r\nFROM\r\n(\r\n  SELECT\r\n    `플랫폼`,\r\n    `pv_수`,\r\n    `세션수`,\r\n    `평균_pv_per_세션`,\r\n    `pv_비율`\r\n  FROM `전체_행`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    `플랫폼`,\r\n    `pv_수`,\r\n    `세션수`,\r\n    `평균_pv_per_세션`,\r\n    `pv_비율`\r\n  FROM `플랫폼_행목록`\r\n)\r\nORDER BY multiIf(\r\n  `플랫폼` = '전체', 0,\r\n  `플랫폼` = '웹', 1,\r\n  `플랫폼` = 'IOS', 2,\r\n  `플랫폼` = 'AOS', 3,\r\n  4\r\n);",
    "panelSpec": {
      "kind": "Panel",
      "id": 3,
      "title": "1-4. 플랫폼별 세션당 평균 PV (Average Page Views per Session by Platform)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 0,
        "y": 20,
        "w": 24,
        "h": 7,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "`플랫폼`",
        "`pv_수`",
        "`세션수`",
        "`평균_pv_per_세션`",
        "`pv_비율`"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "green"
              },
              {
                "value": 100,
                "color": "blue"
              }
            ]
          },
          "decimals": 1,
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`플랫폼`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "플랫폼"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`pv_수`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "PV 수"
              },
              {
                "id": "unit",
                "value": "none"
              },
              {
                "id": "decimals",
                "value": 0
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`세션수`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "세션 수"
              },
              {
                "id": "unit",
                "value": "none"
              },
              {
                "id": "decimals",
                "value": 0
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`평균_pv_per_세션`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "평균 PV"
              },
              {
                "id": "unit",
                "value": "none"
              },
              {
                "id": "decimals",
                "value": 2
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`pv_비율`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "PV 비율"
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "gradient",
                  "type": "color-background"
                }
              },
              {
                "id": "color"
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "1-5": {
    "title": "1-5. 플랫폼별 세션 체류시간 분포 (Session Duration Distribution by Platform)",
    "query": "WITH\r\n`세션_기준데이터` AS (\r\n  SELECT\r\n    argMax(`사용자_ID`, `클라이언트_시각`) AS `세션_사용자_ID`,\r\n    `세션_ID`,\r\n    multiIf(\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`'), '웹',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) = '`IOS`', 'IOS',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`AOS`', '`안드로이드`'), 'AOS',\r\n      '기타'\r\n    ) AS `플랫폼_그룹`,\r\n    dateDiff('second', min(`클라이언트_시각`), max(`클라이언트_시각`)) AS `체류시간_초`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY `세션_ID`\r\n),\r\n\r\n`필터된` AS (\r\n  SELECT *\r\n  FROM `세션_기준데이터`\r\n  WHERE `플랫폼_그룹` IN ('웹', 'IOS', 'AOS')\r\n    AND `체류시간_초` BETWEEN 1 AND 10800\r\n)\r\n\r\nSELECT\r\n  `플랫폼`,\r\n  `유효_세션수`,\r\n  `평균_초`,\r\n  `중앙값_초`,\r\n  `표준_편차_초`,\r\n  `p75_초`,\r\n  `p90_초`,\r\n  `최대_초`\r\nFROM\r\n(\r\n  SELECT\r\n    '전체' AS `플랫폼`,\r\n    count() AS `유효_세션수`,\r\n    round(avg(`체류시간_초`), 2) AS `평균_초`,\r\n    quantile(0.5)(`체류시간_초`) AS `중앙값_초`,\r\n    round(stddevPop(`체류시간_초`), 2) AS `표준_편차_초`,\r\n    quantile(0.75)(`체류시간_초`) AS `p75_초`,\r\n    quantile(0.9)(`체류시간_초`) AS `p90_초`,\r\n    max(`체류시간_초`) AS `최대_초`\r\n  FROM `필터된`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    `플랫폼_그룹` AS `플랫폼`,\r\n    count() AS `유효_세션수`,\r\n    round(avg(`체류시간_초`), 2) AS `평균_초`,\r\n    quantile(0.5)(`체류시간_초`) AS `중앙값_초`,\r\n    round(stddevPop(`체류시간_초`), 2) AS `표준_편차_초`,\r\n    quantile(0.75)(`체류시간_초`) AS `p75_초`,\r\n    quantile(0.9)(`체류시간_초`) AS `p90_초`,\r\n    max(`체류시간_초`) AS `최대_초`\r\n  FROM `필터된`\r\n  GROUP BY `플랫폼_그룹`\r\n)\r\nORDER BY multiIf(\r\n  `플랫폼` = '전체', 0,\r\n  `플랫폼` = '웹', 1,\r\n  `플랫폼` = 'IOS', 2,\r\n  `플랫폼` = 'AOS', 3,\r\n  4\r\n);",
    "panelSpec": {
      "kind": "Panel",
      "id": 4,
      "title": "1-5. 플랫폼별 세션 체류시간 분포 (Session Duration Distribution by Platform)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 0,
        "y": 27,
        "w": 24,
        "h": 7,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "`유효_세션수`",
        "`평균_초`",
        "`중앙값_초`",
        "`p75_초`",
        "`p90_초`",
        "`표준_편차_초`",
        "`최대_초`"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "blue"
              }
            ]
          },
          "min": 0,
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`유효_세션수`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "유효 체류 세션 수"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`평균_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "체류시간 평균"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`중앙값_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "체류시간 중앙값"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`p75_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "상위 25%(P75)"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`p90_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "상위 10%(P90)"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`표준_편차_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "체류시간 표준편차"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "`최대_초`"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "최대 체류시간(이상치)"
              },
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "1-6": {
    "title": "1-6. 체류시간 기준 초과/이하 세션 비중 (Session Duration Above/Below Benchmark)",
    "query": "WITH\r\n`세션_durations` AS (\r\n  SELECT\r\n    argMax(`사용자_ID`, `클라이언트_시각`) AS `세션_사용자_ID`,\r\n    `세션_ID`,\r\n    multiIf(\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`'), '웹',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) = '`IOS`', 'IOS',\r\n      lower(argMax(`플랫폼`, `클라이언트_시각`)) IN ('`AOS`', '`안드로이드`'), 'AOS',\r\n      '기타'\r\n    ) AS `플랫폼_그룹`,\r\n    dateDiff('second', min(`클라이언트_시각`), max(`클라이언트_시각`)) AS `체류시간_초`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY `세션_ID`\r\n),\r\n\r\n`필터된` AS (\r\n  SELECT *\r\n  FROM `세션_durations`\r\n  WHERE `플랫폼_그룹` IN ('웹', 'IOS', 'AOS')\r\n    AND `체류시간_초` BETWEEN 1 AND 10800\r\n),\r\n\r\n`전체_통계` AS (\r\n  SELECT\r\n    avg(`체류시간_초`) AS `전체_평균_초`,\r\n    quantile(0.5)(`체류시간_초`) AS `전체_중앙값_초`\r\n  FROM `필터된`\r\n)\r\n\r\nSELECT\r\n  `플랫폼`,\r\n  `평균 초과 세션 수`,\r\n  `평균 초과 비율(%)`,\r\n  `평균 이하 세션 수`,\r\n  `중앙값 초과 세션 수`,\r\n  `중앙값 초과 비율(%)`,\r\n  `중앙값 이하 세션 수`\r\nFROM\r\n(\r\n  SELECT\r\n    `플랫폼` AS `플랫폼`,\r\n\r\n    `over_평균_수` AS `평균 초과 세션 수`,\r\n    round(`over_평균_수` / nullIf(`전체_세션수`, 0) * 100, 2) AS `평균 초과 비율(%)`,\r\n    `under_or_equal_평균_수` AS `평균 이하 세션 수`,\r\n\r\n    `over_중앙값_수` AS `중앙값 초과 세션 수`,\r\n    round(`over_중앙값_수` / nullIf(`전체_세션수`, 0) * 100, 2) AS `중앙값 초과 비율(%)`,\r\n    `under_or_equal_중앙값_수` AS `중앙값 이하 세션 수`,\r\n\r\n    multiIf(\r\n      `플랫폼` = '전체', 0,\r\n      `플랫폼` = '웹', 1,\r\n      `플랫폼` = 'IOS', 2,\r\n      `플랫폼` = 'AOS', 3,\r\n      4\r\n    ) AS sort_order\r\n  FROM\r\n  (\r\n    SELECT\r\n      '전체' AS `플랫폼`,\r\n\r\n      countIf(`체류시간_초` > (SELECT `전체_평균_초` FROM `전체_통계`)) AS `over_평균_수`,\r\n      countIf(`체류시간_초` <= (SELECT `전체_평균_초` FROM `전체_통계`)) AS `under_or_equal_평균_수`,\r\n\r\n      countIf(`체류시간_초` > (SELECT `전체_중앙값_초` FROM `전체_통계`)) AS `over_중앙값_수`,\r\n      countIf(`체류시간_초` <= (SELECT `전체_중앙값_초` FROM `전체_통계`)) AS `under_or_equal_중앙값_수`,\r\n\r\n      count() AS `전체_세션수`\r\n    FROM `필터된`\r\n\r\n    UNION ALL\r\n\r\n    SELECT\r\n      `플랫폼_그룹` AS `플랫폼`,\r\n\r\n      countIf(`체류시간_초` > (SELECT `전체_평균_초` FROM `전체_통계`)) AS `over_평균_수`,\r\n      countIf(`체류시간_초` <= (SELECT `전체_평균_초` FROM `전체_통계`)) AS `under_or_equal_평균_수`,\r\n\r\n      countIf(`체류시간_초` > (SELECT `전체_중앙값_초` FROM `전체_통계`)) AS `over_중앙값_수`,\r\n      countIf(`체류시간_초` <= (SELECT `전체_중앙값_초` FROM `전체_통계`)) AS `under_or_equal_중앙값_수`,\r\n\r\n      count() AS `전체_세션수`\r\n    FROM `필터된`\r\n    GROUP BY `플랫폼_그룹`\r\n  )\r\n)\r\nORDER BY sort_order ASC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 12,
      "title": "1-6. 체류시간 기준 초과/이하 세션 비중 (Session Duration Above/Below Benchmark)",
      "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)",
      "gridPos": {
        "x": 0,
        "y": 34,
        "w": 24,
        "h": 7,
        "row": "Row 1. 주요 접속 지표 요약 (Executive Summary)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "평균 초과 비율(%)",
        "중앙값 초과 비율(%)"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "orange"
              },
              {
                "value": 25,
                "color": "green"
              },
              {
                "value": 50,
                "color": "blue"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 초과 비율(%)"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "평균 초과 비율"
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "중앙값 초과 비율(%)"
            },
            "properties": [
              {
                "id": "displayName",
                "value": "중앙값 초과 비율"
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "2-1": {
    "title": "2-1. 고객 유형 파이프라인 비중 변화 (Customer Type Pipeline Share Trend)",
    "query": "WITH\r\nupdate_dates AS (\r\n  SELECT\r\n    toDate(`프로필_updated_시각`) AS `stat_날짜`\r\n  FROM 고객 프로필 테이블\r\n  WHERE `사용자_ID` != ''\r\n    AND `사용자_ID` != 'anonymous'\r\n    AND `유형_ID` BETWEEN 0 AND 63\r\n    AND $__timeFilter(`프로필_updated_시각`)\r\n  GROUP BY `stat_날짜`\r\n  HAVING countDistinct(`사용자_ID`) >= 100\r\n),\r\n\r\n`유형_spine` AS (\r\n  SELECT\r\n    number AS `프로필_유형_ID`,\r\n    number + 1 AS `유형_no`\r\n  FROM numbers(64)\r\n),\r\n\r\n`유형_labels` AS (\r\n  SELECT\r\n    `유형_ID`,\r\n    any(`segment_명_ko`) AS `segment_명_ko`\r\n  FROM 분석용 테이블\r\n  GROUP BY `유형_ID`\r\n),\r\n\r\n`날짜_유형_spine` AS (\r\n  SELECT\r\n    `일자`.`stat_날짜` AS `stat_날짜`,\r\n    t.`프로필_유형_ID` AS `프로필_유형_ID`,\r\n    t.`유형_no` AS `유형_no`\r\n  FROM update_dates `일자`\r\n  CROSS JOIN `유형_spine` t\r\n),\r\n\r\n`사용자_유형_asof` AS (\r\n  SELECT\r\n    `일자`.`stat_날짜` AS `stat_날짜`,\r\n    `프로필`.`사용자_ID` AS `사용자_ID`,\r\n    argMax(`프로필`.`유형_ID`, `프로필`.`프로필_updated_시각`) AS `유형_ID`\r\n  FROM update_dates `일자`\r\n  INNER JOIN 고객 프로필 테이블 `프로필`\r\n    ON toDate(`프로필`.`프로필_updated_시각`) <= `일자`.`stat_날짜`\r\n  WHERE `프로필`.`사용자_ID` != ''\r\n    AND `프로필`.`사용자_ID` != 'anonymous'\r\n    AND `프로필`.`유형_ID` BETWEEN 0 AND 63\r\n  GROUP BY\r\n    `일자`.`stat_날짜`,\r\n    `프로필`.`사용자_ID`\r\n),\r\n\r\n`daily_유형_요약` AS (\r\n  SELECT\r\n    `stat_날짜`,\r\n    `유형_ID`,\r\n    countDistinct(`사용자_ID`) AS `사용자_수`\r\n  FROM `사용자_유형_asof`\r\n  WHERE `유형_ID` BETWEEN 0 AND 63\r\n  GROUP BY\r\n    `stat_날짜`,\r\n    `유형_ID`\r\n),\r\n\r\n`daily_전체` AS (\r\n  SELECT\r\n    `stat_날짜`,\r\n    sum(`사용자_수`) AS `전체_users`\r\n  FROM `daily_유형_요약`\r\n  GROUP BY `stat_날짜`\r\n),\r\n\r\n`최종_테이블` AS (\r\n  SELECT\r\n    `검색`.`stat_날짜` AS `stat_날짜`,\r\n    `검색`.`프로필_유형_ID` AS `프로필_유형_ID`,\r\n    `검색`.`유형_no` AS `유형_no`,\r\n\r\n    concat(\r\n      'T',\r\n      toString(`검색`.`유형_no`),\r\n      ' - ',\r\n      ifNull(`유형라벨`.`segment_명_ko`, '')\r\n    ) AS `유형_display_명`,\r\n\r\n    ifNull(dts.`사용자_수`, 0) AS `사용자_수`,\r\n    ifNull(`일자`.`전체_users`, 0) AS `전체_users`,\r\n\r\n    round(\r\n      ifNull(dts.`사용자_수`, 0)\r\n      / nullIf(`일자`.`전체_users`, 0)\r\n      * 100,\r\n      4\r\n    ) AS `비중_비율`\r\n\r\n  FROM `날짜_유형_spine` `검색`\r\n\r\n  LEFT JOIN `daily_유형_요약` dts\r\n    ON `검색`.`stat_날짜` = dts.`stat_날짜`\r\n   AND `검색`.`프로필_유형_ID` = dts.`유형_ID`\r\n\r\n  LEFT JOIN `daily_전체` `일자`\r\n    ON `검색`.`stat_날짜` = `일자`.`stat_날짜`\r\n\r\n  LEFT JOIN `유형_labels` `유형라벨`\r\n    ON `검색`.`유형_no` = `유형라벨`.`유형_ID`\r\n),\r\n\r\n`최신_날짜` AS (\r\n  SELECT\r\n    max(`stat_날짜`) AS `max_stat_날짜`\r\n  FROM `최종_테이블`\r\n),\r\n\r\n`최신_비중` AS (\r\n  SELECT\r\n    `프로필_유형_ID`,\r\n    max(`비중_비율`) AS `최신_비중_비율`\r\n  FROM `최종_테이블`\r\n  WHERE `stat_날짜` = (SELECT `max_stat_날짜` FROM `최신_날짜`)\r\n  GROUP BY `프로필_유형_ID`\r\n)\r\n\r\nSELECT\r\n  toDateTime(ft.`stat_날짜`) AS `시간`,\r\n  ft.`유형_display_명` AS metric,\r\n  ft.`비중_비율` AS value\r\nFROM `최종_테이블` ft\r\nLEFT JOIN `최신_비중` ls\r\n  ON ft.`프로필_유형_ID` = ls.`프로필_유형_ID`\r\nWHERE ft.`전체_users` > 0\r\nORDER BY\r\n  `시간` ASC,\r\n  ls.`최신_비중_비율` DESC,\r\n  ft.`프로필_유형_ID` ASC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 16,
      "title": "2-1. 고객 유형 파이프라인 비중 변화 (Customer Type Pipeline Share Trend)",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 0,
        "w": 24,
        "h": 17,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "timeseries",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "drawStyle": "bars",
            "lineInterpolation": "linear",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "lineWidth": 1,
            "fillOpacity": 70,
            "gradientMode": "none",
            "spanNulls": false,
            "insertNulls": false,
            "showPoints": "auto",
            "showValues": false,
            "pointSize": 20,
            "stacking": {
              "mode": "normal",
              "group": "A"
            },
            "axisPlacement": "auto",
            "axisLabel": "",
            "axisColorMode": "text",
            "axisBorderShow": false,
            "scaleDistribution": {
              "type": "linear"
            },
            "axisCenteredZero": false,
            "hideFrom": {
              "tooltip": false,
              "viz": false,
              "legend": false
            },
            "thresholdsStyle": {
              "mode": "off"
            },
            "axisSoftMax": 100,
            "axisSoftMin": 0
          },
          "color": {
            "mode": "palette-classic-by-`명`"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              }
            ]
          },
          "displayName": "${__field.labels.metric}",
          "unit": "`비율`",
          "decimals": 1,
          "min": 0,
          "max": 100
        },
        "overrides": []
      },
      "options": {
        "tooltip": {
          "mode": "multi",
          "sort": "desc",
          "hideZeros": false
        },
        "legend": {
          "showLegend": true,
          "displayMode": "`테이블`",
          "placement": "bottom",
          "calcs": [
            "lastNotNull"
          ],
          "sortBy": "`마지막` *",
          "sortDesc": true
        },
        "annotations": {
          "multiLane": false,
          "clustering": -1
        }
      },
      "transformations": []
    }
  },
  "2-2": {
    "title": "2-2. 고객 타입별 누적 회원 현황 (Cumulative Members by Customer Type)",
    "query": "WITH\r\n  `target_날짜` AS (\r\n    SELECT\r\n      today() AS `stat_날짜`\r\n  ),\r\n\r\n  `유형_spine` AS (\r\n    SELECT\r\n      number AS `유형_ID`\r\n    FROM numbers(64)\r\n  ),\r\n\r\n  `유형_요약` AS (\r\n    SELECT\r\n      t.`유형_ID` AS `유형_ID`,\r\n\r\n      countDistinctIf(\r\n        `프로필`.`사용자_ID`,\r\n        `프로필`.`사용자_ID` != ''\r\n      ) AS `누적_수`,\r\n\r\n      countDistinctIf(\r\n        `프로필`.`사용자_ID`,\r\n        `프로필`.`사용자_ID` != ''\r\n        AND toDate(`프로필`.`프로필_updated_시각`) = `일자`.`stat_날짜`\r\n      ) AS `오늘_변경_수`\r\n\r\n    FROM `유형_spine` AS t\r\n    CROSS JOIN `target_날짜` AS `일자`\r\n    LEFT JOIN 고객 프로필 테이블 AS `프로필`\r\n      ON `프로필`.`유형_ID` = t.`유형_ID`\r\n    GROUP BY\r\n      t.`유형_ID`\r\n  ),\r\n\r\n  `전체_요약` AS (\r\n    SELECT\r\n      sum(`누적_수`) AS `전체_누적_수`,\r\n      sum(`오늘_변경_수`) AS `전체_오늘_변경_수`\r\n    FROM `유형_요약`\r\n  )\r\n\r\nSELECT\r\n  \"고객 타입([1]본식 [2]촬영 [3]스드메 [4]웨딩홀 [5]혼수 [6]본식상품)\",\r\n  \"오늘 타입 상태 업데이트된 고객 수\",\r\n  \"누적 수\",\r\n  \"비중\"\r\nFROM\r\n(\r\n  SELECT\r\n    0 AS sort_order,\r\n    '합계' AS \"고객 타입([1]본식 [2]촬영 [3]스드메 [4]웨딩홀 [5]혼수 [6]본식상품)\",\r\n    `전체_오늘_변경_수` AS \"오늘 타입 상태 업데이트된 고객 수\",\r\n    `전체_누적_수` AS \"누적 수\",\r\n    100.00 AS \"비중\"\r\n  FROM `전체_요약`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    `검색`.`유형_ID` + 1 AS sort_order,\r\n    CASE\r\n  WHEN `검색`.`유형_ID` = 0 THEN 'T1: `계약상태패턴`신규/완전 탐색형'\r\n  WHEN `검색`.`유형_ID` = 1 THEN 'T2: `계약상태패턴`본식상품 단독 유입형'\r\n  WHEN `검색`.`유형_ID` = 2 THEN 'T3: `계약상태패턴`혼수 단독 계약형'\r\n  WHEN `검색`.`유형_ID` = 3 THEN 'T4: `계약상태패턴`혼수+본식상품 선계약형'\r\n  WHEN `검색`.`유형_ID` = 4 THEN 'T5: `계약상태패턴`웨딩홀 단독 계약형'\r\n  WHEN `검색`.`유형_ID` = 5 THEN 'T6: `계약상태패턴`홀+본식상품 확정형'\r\n  WHEN `검색`.`유형_ID` = 6 THEN 'T7: `계약상태패턴`홀+혼수 확정형'\r\n  WHEN `검색`.`유형_ID` = 7 THEN 'T8: `계약상태패턴`스드메 미정/외 확정형'\r\n  WHEN `검색`.`유형_ID` = 8 THEN 'T9: `계약상태패턴`스드메 선계약형'\r\n  WHEN `검색`.`유형_ID` = 9 THEN 'T10: `계약상태패턴`스드메+본식상품 확정형'\r\n  WHEN `검색`.`유형_ID` = 10 THEN 'T11: `계약상태패턴`스드메+혼수 확정형'\r\n  WHEN `검색`.`유형_ID` = 11 THEN 'T12: `계약상태패턴`홀 미정/외 확정형'\r\n  WHEN `검색`.`유형_ID` = 12 THEN 'T13: `계약상태패턴`홀+스드메 확정형'\r\n  WHEN `검색`.`유형_ID` = 13 THEN 'T14: `계약상태패턴`혼수 미정/외 확정형'\r\n  WHEN `검색`.`유형_ID` = 14 THEN 'T15: `계약상태패턴`본식상품 미정/외 확정형'\r\n  WHEN `검색`.`유형_ID` = 15 THEN 'T16: `계약상태패턴`일정 미정/외 확정형'\r\n  WHEN `검색`.`유형_ID` = 16 THEN 'T17: `계약상태패턴`촬영 단독 확정형'\r\n  WHEN `검색`.`유형_ID` = 17 THEN 'T18: `계약상태패턴`촬영+본식상품 확정형'\r\n  WHEN `검색`.`유형_ID` = 18 THEN 'T19: `계약상태패턴`촬영+혼수 확정형'\r\n  WHEN `검색`.`유형_ID` = 19 THEN 'T20: `계약상태패턴`홀+스드메 미정형'\r\n  WHEN `검색`.`유형_ID` = 20 THEN 'T21: `계약상태패턴`촬영+홀 확정형'\r\n  WHEN `검색`.`유형_ID` = 21 THEN 'T22: `계약상태패턴`스드메+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 22 THEN 'T23: `계약상태패턴`스드메+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 23 THEN 'T24: `계약상태패턴`스드메 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 24 THEN 'T25: `계약상태패턴`홀+본식+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 25 THEN 'T26: `계약상태패턴`홀+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 26 THEN 'T27: `계약상태패턴`홀+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 27 THEN 'T28: `계약상태패턴`홀 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 28 THEN 'T29: `계약상태패턴`본식일정+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 29 THEN 'T30: `계약상태패턴`본식일정+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 30 THEN 'T31: `계약상태패턴`본식일정+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 31 THEN 'T32: `계약상태패턴`본식일정 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 32 THEN 'T33: `계약상태패턴`본식일정 단독 확정형'\r\n  WHEN `검색`.`유형_ID` = 33 THEN 'T34: `계약상태패턴`일정+본식상품 확정형'\r\n  WHEN `검색`.`유형_ID` = 34 THEN 'T35: `계약상태패턴`일정+혼수 확정형'\r\n  WHEN `검색`.`유형_ID` = 35 THEN 'T36: `계약상태패턴`일정+혼수+본식 확정형'\r\n  WHEN `검색`.`유형_ID` = 36 THEN 'T37: `계약상태패턴`본식일정+홀 확정형'\r\n  WHEN `검색`.`유형_ID` = 37 THEN 'T38: `계약상태패턴`스드메+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 38 THEN 'T39: `계약상태패턴`스드메+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 39 THEN 'T40: `계약상태패턴`스드메 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 40 THEN 'T41: `계약상태패턴`일정+스드메 확정형'\r\n  WHEN `검색`.`유형_ID` = 41 THEN 'T42: `계약상태패턴`홀+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 42 THEN 'T43: `계약상태패턴`홀+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 43 THEN 'T44: `계약상태패턴`웨딩홀 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 44 THEN 'T45: `계약상태패턴`혼수+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 45 THEN 'T46: `계약상태패턴`촬영+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 46 THEN 'T47: `계약상태패턴`촬영+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 47 THEN 'T48: `계약상태패턴`촬영일정 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 48 THEN 'T49: `계약상태패턴`일정만 확정형'\r\n  WHEN `검색`.`유형_ID` = 49 THEN 'T50: `계약상태패턴`홀+스드메+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 50 THEN 'T51: `계약상태패턴`홀+스드메+본식상품 미정'\r\n  WHEN `검색`.`유형_ID` = 51 THEN 'T52: `계약상태패턴`홀+스드메 미정형'\r\n  WHEN `검색`.`유형_ID` = 52 THEN 'T53: `계약상태패턴`스드메+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 53 THEN 'T54: `계약상태패턴`스드메+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 54 THEN 'T55: `계약상태패턴`스드메+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 55 THEN 'T56: `계약상태패턴`스드메 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 56 THEN 'T57: `계약상태패턴`홀+본식+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 57 THEN 'T58: `계약상태패턴`홀+혼수 미정형'\r\n  WHEN `검색`.`유형_ID` = 58 THEN 'T59: `계약상태패턴`홀+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 59 THEN 'T60: `계약상태패턴`웨딩홀 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 60 THEN 'T61: `계약상태패턴`혼수+본식상품 미정형'\r\n  WHEN `검색`.`유형_ID` = 61 THEN 'T62: `계약상태패턴`혼수 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 62 THEN 'T63: `계약상태패턴`본식상품 단독 미정형'\r\n  WHEN `검색`.`유형_ID` = 63 THEN 'T64: `계약상태패턴`준비 완성형'\r\n  ELSE concat('T', toString(`검색`.`유형_ID` + 1))\r\nEND AS \"고객 타입([1]본식 [2]촬영 [3]스드메 [4]웨딩홀 [5]혼수 [6]본식상품)\",\r\n    `검색`.`오늘_변경_수` AS \"오늘 타입 상태 업데이트된 고객 수\",\r\n    `검색`.`누적_수` AS \"누적 수\",\r\n    round(\r\n      `검색`.`누적_수` / nullIf(t.`전체_누적_수`, 0) * 100,\r\n      2\r\n    ) AS \"비중\"\r\n  FROM `유형_요약` AS `검색`\r\n  CROSS JOIN `전체_요약` AS t\r\n)\r\nORDER BY sort_order ASC",
    "panelSpec": {
      "kind": "Panel",
      "id": 15,
      "title": "2-2. 고객 타입별 누적 회원 현황 (Cumulative Members by Customer Type)",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 17,
        "w": 24,
        "h": 13,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "비중",
        "누적 수",
        "오늘 타입 상태 업데이트된 고객 수"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "#EAB839"
              },
              {
                "value": 75,
                "color": "green"
              },
              {
                "value": 100,
                "color": "blue"
              }
            ]
          },
          "decimals": 0,
          "min": 0,
          "max": 0,
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "비중"
            },
            "properties": [
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "gradient",
                  "type": "color-background"
                }
              },
              {
                "id": "color",
                "value": {
                  "mode": "thresholds"
                }
              },
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "custom.width",
                "value": 100
              },
              {
                "id": "decimals",
                "value": 2
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "누적 수"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 150
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "오늘 타입 상태 업데이트된 고객 수"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 250
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm",
        "frameIndex": 40
      },
      "transformations": [
        {
          "kind": "Transformation",
          "group": "partitionByValues",
          "spec": {
            "options": {
              "fields": [
                "metric"
              ],
              "keepFields": false,
              "naming": {
                "asLabels": false
              }
            }
          }
        }
      ]
    }
  },
  "2-3": {
    "title": "2-3. 평균 체류시간 초과 세션 유형별 요약 및 고객 목록 (Above-Average Session Summary by Customer Type)",
    "query": "WITH\r\n  `유형_labels` AS (\r\n    SELECT\r\n      number AS `유형_ID`,\r\n      CASE\r\n        WHEN number = 0 THEN 'T1: `계약상태패턴`신규/완전 탐색형'\r\n        WHEN number = 1 THEN 'T2: `계약상태패턴`본식상품 단독 유입형'\r\n        WHEN number = 2 THEN 'T3: `계약상태패턴`혼수 단독 계약형'\r\n        WHEN number = 3 THEN 'T4: `계약상태패턴`혼수+본식상품 선계약형'\r\n        WHEN number = 4 THEN 'T5: `계약상태패턴`웨딩홀 단독 계약형'\r\n        WHEN number = 5 THEN 'T6: `계약상태패턴`홀+본식상품 확정형'\r\n        WHEN number = 6 THEN 'T7: `계약상태패턴`홀+혼수 확정형'\r\n        WHEN number = 7 THEN 'T8: `계약상태패턴`스드메 미정/외 확정형'\r\n        WHEN number = 8 THEN 'T9: `계약상태패턴`스드메 선계약형'\r\n        WHEN number = 9 THEN 'T10: `계약상태패턴`스드메+본식상품 확정형'\r\n        WHEN number = 10 THEN 'T11: `계약상태패턴`스드메+혼수 확정형'\r\n        WHEN number = 11 THEN 'T12: `계약상태패턴`홀 미정/외 확정형'\r\n        WHEN number = 12 THEN 'T13: `계약상태패턴`홀+스드메 확정형'\r\n        WHEN number = 13 THEN 'T14: `계약상태패턴`혼수 미정/외 확정형'\r\n        WHEN number = 14 THEN 'T15: `계약상태패턴`본식상품 미정/외 확정형'\r\n        WHEN number = 15 THEN 'T16: `계약상태패턴`일정 미정/외 확정형'\r\n        WHEN number = 16 THEN 'T17: `계약상태패턴`촬영 단독 확정형'\r\n        WHEN number = 17 THEN 'T18: `계약상태패턴`촬영+본식상품 확정형'\r\n        WHEN number = 18 THEN 'T19: `계약상태패턴`촬영+혼수 확정형'\r\n        WHEN number = 19 THEN 'T20: `계약상태패턴`홀+스드메 미정형'\r\n        WHEN number = 20 THEN 'T21: `계약상태패턴`촬영+홀 확정형'\r\n        WHEN number = 21 THEN 'T22: `계약상태패턴`스드메+혼수 미정형'\r\n        WHEN number = 22 THEN 'T23: `계약상태패턴`스드메+본식상품 미정형'\r\n        WHEN number = 23 THEN 'T24: `계약상태패턴`스드메 단독 미정형'\r\n        WHEN number = 24 THEN 'T25: `계약상태패턴`홀+본식+혼수 미정형'\r\n        WHEN number = 25 THEN 'T26: `계약상태패턴`홀+혼수 미정형'\r\n        WHEN number = 26 THEN 'T27: `계약상태패턴`홀+본식상품 미정형'\r\n        WHEN number = 27 THEN 'T28: `계약상태패턴`홀 단독 미정형'\r\n        WHEN number = 28 THEN 'T29: `계약상태패턴`본식일정+본식상품 미정형'\r\n        WHEN number = 29 THEN 'T30: `계약상태패턴`본식일정+혼수 미정형'\r\n        WHEN number = 30 THEN 'T31: `계약상태패턴`본식일정+본식상품 미정형'\r\n        WHEN number = 31 THEN 'T32: `계약상태패턴`본식일정 단독 미정형'\r\n        WHEN number = 32 THEN 'T33: `계약상태패턴`본식일정 단독 확정형'\r\n        WHEN number = 33 THEN 'T34: `계약상태패턴`일정+본식상품 확정형'\r\n        WHEN number = 34 THEN 'T35: `계약상태패턴`일정+혼수 확정형'\r\n        WHEN number = 35 THEN 'T36: `계약상태패턴`일정+혼수+본식 확정형'\r\n        WHEN number = 36 THEN 'T37: `계약상태패턴`본식일정+홀 확정형'\r\n        WHEN number = 37 THEN 'T38: `계약상태패턴`스드메+혼수 미정형'\r\n        WHEN number = 38 THEN 'T39: `계약상태패턴`스드메+본식상품 미정형'\r\n        WHEN number = 39 THEN 'T40: `계약상태패턴`스드메 단독 미정형'\r\n        WHEN number = 40 THEN 'T41: `계약상태패턴`일정+스드메 확정형'\r\n        WHEN number = 41 THEN 'T42: `계약상태패턴`홀+혼수 미정형'\r\n        WHEN number = 42 THEN 'T43: `계약상태패턴`홀+본식상품 미정형'\r\n        WHEN number = 43 THEN 'T44: `계약상태패턴`웨딩홀 단독 미정형'\r\n        WHEN number = 44 THEN 'T45: `계약상태패턴`혼수+본식상품 미정형'\r\n        WHEN number = 45 THEN 'T46: `계약상태패턴`촬영+혼수 미정형'\r\n        WHEN number = 46 THEN 'T47: `계약상태패턴`촬영+본식상품 미정형'\r\n        WHEN number = 47 THEN 'T48: `계약상태패턴`촬영일정 단독 미정형'\r\n        WHEN number = 48 THEN 'T49: `계약상태패턴`일정만 확정형'\r\n        WHEN number = 49 THEN 'T50: `계약상태패턴`홀+스드메+혼수 미정형'\r\n        WHEN number = 50 THEN 'T51: `계약상태패턴`홀+스드메+본식상품 미정'\r\n        WHEN number = 51 THEN 'T52: `계약상태패턴`홀+스드메 미정형'\r\n        WHEN number = 52 THEN 'T53: `계약상태패턴`스드메+혼수 미정형'\r\n        WHEN number = 53 THEN 'T54: `계약상태패턴`스드메+혼수 미정형'\r\n        WHEN number = 54 THEN 'T55: `계약상태패턴`스드메+본식상품 미정형'\r\n        WHEN number = 55 THEN 'T56: `계약상태패턴`스드메 단독 미정형'\r\n        WHEN number = 56 THEN 'T57: `계약상태패턴`홀+본식+혼수 미정형'\r\n        WHEN number = 57 THEN 'T58: `계약상태패턴`홀+혼수 미정형'\r\n        WHEN number = 58 THEN 'T59: `계약상태패턴`홀+본식상품 미정형'\r\n        WHEN number = 59 THEN 'T60: `계약상태패턴`웨딩홀 단독 미정형'\r\n        WHEN number = 60 THEN 'T61: `계약상태패턴`혼수+본식상품 미정형'\r\n        WHEN number = 61 THEN 'T62: `계약상태패턴`혼수 단독 미정형'\r\n        WHEN number = 62 THEN 'T63: `계약상태패턴`본식상품 단독 미정형'\r\n        WHEN number = 63 THEN 'T64: `계약상태패턴`준비 완성형'\r\n        ELSE concat('T', toString(number + 1))\r\n      END AS `유형_label`\r\n    FROM numbers(64)\r\n  ),\r\n\r\n  `세션_durations` AS (\r\n    SELECT\r\n      `사용자_ID`,\r\n      `세션_ID`,\r\n      dateDiff('millisecond', min(`클라이언트_시각`), max(`클라이언트_시각`)) AS `체류시간_밀리초`\r\n    FROM 행동 이벤트 테이블\r\n    WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n      AND `세션_ID` != ''\r\n      AND `사용자_ID` != ''\r\n      AND (\r\n        '${`검색_사용자ID`}' = ''\r\n        OR '${`검색_사용자ID`}' = 'All'\r\n        OR `사용자_ID` = '${`검색_사용자ID`}'\r\n      )\r\n    GROUP BY\r\n      `사용자_ID`,\r\n      `세션_ID`\r\n  ),\r\n\r\n  `전체_통계` AS (\r\n    SELECT\r\n      avg(`체류시간_밀리초`) AS `전체_평균_밀리초`\r\n    FROM `세션_durations`\r\n  ),\r\n\r\n  `over_평균_세션수` AS (\r\n    SELECT\r\n      `검색`.`사용자_ID`,\r\n      `검색`.`세션_ID`,\r\n      `검색`.`체류시간_밀리초`\r\n    FROM `세션_durations` AS `검색`\r\n    CROSS JOIN `전체_통계` AS g\r\n    WHERE `검색`.`체류시간_밀리초` > g.`전체_평균_밀리초`\r\n  ),\r\n\r\n  `프로필_최신` AS (\r\n    SELECT\r\n      `사용자_ID`,\r\n      anyLast(`계약_상태_마스크`) AS `계약_상태_마스크`,\r\n      anyLast(`유형_ID`) AS `유형_ID`\r\n    FROM 고객 프로필 테이블\r\n    WHERE `사용자_ID` != ''\r\n    GROUP BY `사용자_ID`\r\n  ),\r\n\r\n  `enriched_세션수` AS (\r\n    SELECT\r\n      o.`사용자_ID`,\r\n      o.`세션_ID`,\r\n      o.`체류시간_밀리초`,\r\n      `프로필`.`계약_상태_마스크`,\r\n      `프로필`.`유형_ID`\r\n    FROM `over_평균_세션수` AS o\r\n    LEFT JOIN `프로필_최신` AS `프로필`\r\n      ON o.`사용자_ID` = `프로필`.`사용자_ID`\r\n  ),\r\n\r\n  `유형_요약` AS (\r\n    SELECT\r\n      `유형_ID`,\r\n      countDistinct(`세션_ID`) AS `over_평균_세션_수`,\r\n      countDistinct(`사용자_ID`) AS `사용자_수`\r\n    FROM `enriched_세션수`\r\n    WHERE `유형_ID` BETWEEN 0 AND 63\r\n    GROUP BY `유형_ID`\r\n    HAVING `over_평균_세션_수` >= 1\r\n  ),\r\n\r\n  `전체_요약` AS (\r\n    SELECT\r\n      countDistinct(`세션_ID`) AS `전체_over_평균_세션_수`,\r\n      countDistinct(`사용자_ID`) AS `전체_사용자_수`\r\n    FROM `enriched_세션수`\r\n  ),\r\n\r\n  `상세_행목록` AS (\r\n    SELECT\r\n      row_number() OVER (\r\n        ORDER BY\r\n          `유형_ID` ASC,\r\n          `사용자_ID` ASC\r\n      ) AS rn,\r\n      `사용자_ID`,\r\n      `계약_상태_마스크`,\r\n      `유형_ID`,\r\n      countDistinct(`세션_ID`) AS `사용자_over_평균_세션_수`\r\n    FROM `enriched_세션수`\r\n    WHERE `유형_ID` BETWEEN 0 AND 63\r\n    GROUP BY\r\n      `사용자_ID`,\r\n      `계약_상태_마스크`,\r\n      `유형_ID`\r\n  )\r\n\r\nSELECT\r\n  \"구분\",\r\n  \"순번\",\r\n  \"유저 ID\",\r\n  \"계약상태\",\r\n  \"유형 ID\",\r\n  \"평균초과 세션 수\",\r\n  \"고객 수\"\r\nFROM\r\n(\r\n  SELECT\r\n    0 AS `sort_그룹`,\r\n    0 AS sort_order,\r\n    '전체요약' AS \"구분\",\r\n    '' AS \"순번\",\r\n    '' AS \"유저 ID\",\r\n    '' AS \"계약상태\",\r\n    '전체' AS \"유형 ID\",\r\n    `전체_over_평균_세션_수` AS \"평균초과 세션 수\",\r\n    `전체_사용자_수` AS \"고객 수\"\r\n  FROM `전체_요약`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    1 AS `sort_그룹`,\r\n    `시각`.`유형_ID` + 1 AS sort_order,\r\n    '유형요약' AS \"구분\",\r\n    '' AS \"순번\",\r\n    '' AS \"유저 ID\",\r\n    '' AS \"계약상태\",\r\n    `유형라벨`.`유형_label` AS \"유형 ID\",\r\n    `시각`.`over_평균_세션_수` AS \"평균초과 세션 수\",\r\n    `시각`.`사용자_수` AS \"고객 수\"\r\n  FROM `유형_요약` AS `시각`\r\n  LEFT JOIN `유형_labels` AS `유형라벨`\r\n    ON `시각`.`유형_ID` = `유형라벨`.`유형_ID`\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    2 AS `sort_그룹`,\r\n    `일자`.rn AS sort_order,\r\n    '상세' AS \"구분\",\r\n    toString(`일자`.rn) AS \"순번\",\r\n    `일자`.`사용자_ID` AS \"유저 ID\",\r\n    toString(`일자`.`계약_상태_마스크`) AS \"계약상태\",\r\n    `유형라벨`.`유형_label` AS \"유형 ID\",\r\n    `일자`.`사용자_over_평균_세션_수` AS \"평균초과 세션 수\",\r\n    1 AS \"고객 수\"\r\n  FROM `상세_행목록` AS `일자`\r\n  LEFT JOIN `유형_labels` AS `유형라벨`\r\n    ON `일자`.`유형_ID` = `유형라벨`.`유형_ID`\r\n)\r\nORDER BY\r\n  `sort_그룹` ASC,\r\n  sort_order ASC",
    "panelSpec": {
      "kind": "Panel",
      "id": 17,
      "title": "2-3. 평균 체류시간 초과 세션 유형별 요약 및 고객 목록 (Above-Average Session Summary by Customer Type)",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 30,
        "w": 24,
        "h": 13,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "구분",
        "순번",
        "유저 ID",
        "계약상태",
        "평균초과 세션 수",
        "고객 수"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "구분"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 100
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "순번"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 50
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "유저 ID"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 150
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "계약상태"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 100
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균초과 세션 수"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 120
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "고객 수"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 120
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "2-4": {
    "title": "2-4. 유저 마스터 정보 (Status Profile)",
    "query": "WITH\r\n`프로필` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `계약_상태_마스크`,\r\n    `유형_ID`,\r\n    `프로필_updated_시각`,\r\n    `행사_날짜_예정`\r\n  FROM 고객 프로필 테이블\r\n),\r\n\r\n`행동` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    countDistinct(`세션_ID`) AS `전체_세션수`,\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `전체_페이지_views`,\r\n    countIf(`이벤트_유형` = '`검색`') AS `전체_searches`,\r\n    countIf(`이벤트_유형` = '`상품클릭`') AS `전체_상품_clicks`,\r\n    min(`클라이언트_시각`) AS `최초_seen_at`,\r\n    max(`클라이언트_시각`) AS `마지막_seen_at`,\r\n    argMax(`플랫폼`, `클라이언트_시각`) AS `주요_플랫폼`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY `사용자_ID`\r\n),\r\n\r\n`세션_체류시간` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    round(avg(`체류시간_초`), 2) AS `평균_세션_체류시간_초`\r\n  FROM (\r\n    SELECT\r\n      `사용자_ID`,\r\n      `세션_ID`,\r\n      dateDiff('second', min(`클라이언트_시각`), max(`클라이언트_시각`)) AS `체류시간_초`\r\n    FROM 행동 이벤트 테이블\r\n    WHERE `세션_ID` != ''\r\n      AND (\r\n        '${`검색_사용자ID`}' = ''\r\n        OR '${`검색_사용자ID`}' = 'All'\r\n        OR `사용자_ID` = '${`검색_사용자ID`}'\r\n      )\r\n    GROUP BY `사용자_ID`, `세션_ID`\r\n  )\r\n  WHERE `체류시간_초` BETWEEN 1 AND 10800\r\n  GROUP BY `사용자_ID`\r\n),\r\n\r\n`최종_테이블` AS (\r\n  SELECT\r\n    `프로필`.`사용자_ID` AS `사용자_ID`,\r\n    `프로필`.`계약_상태_마스크` AS `계약_상태_마스크`,\r\n    `프로필`.`유형_ID` AS `유형_ID`,\r\n\r\n    ifNull(`행동`.`전체_세션수`, 0) AS `전체_세션수`,\r\n    ifNull(`행동`.`전체_페이지_views`, 0) AS `전체_페이지_views`,\r\n\r\n    round(\r\n      ifNull(`행동`.`전체_페이지_views`, 0)\r\n      / nullIf(ifNull(`행동`.`전체_세션수`, 0), 0),\r\n      2\r\n    ) AS `평균_pv_per_세션`,\r\n\r\n    ifNull(`검색`.`평균_세션_체류시간_초`, 0) AS `평균_세션_체류시간_초`,\r\n    ifNull(`행동`.`전체_searches`, 0) AS `전체_searches`,\r\n    ifNull(`행동`.`전체_상품_clicks`, 0) AS `전체_상품_clicks`,\r\n\r\n    `프로필`.`프로필_updated_시각` AS `프로필_updated_시각`,\r\n\r\n    `행동`.`최초_seen_at` AS `최초_seen_at`,\r\n    `행동`.`마지막_seen_at` AS `마지막_seen_at`,\r\n\r\n    ifNull(`행동`.`주요_플랫폼`, '') AS `주요_플랫폼`,\r\n    `프로필`.`행사_날짜_예정` AS `행사_날짜_예정`\r\n\r\n  FROM `프로필` `프로필`\r\n  LEFT JOIN `행동` `행동`\r\n    ON `프로필`.`사용자_ID` = `행동`.`사용자_ID`\r\n  LEFT JOIN `세션_체류시간` `검색`\r\n    ON `프로필`.`사용자_ID` = `검색`.`사용자_ID`\r\n  WHERE (\r\n    '${`검색_사용자ID`}' = ''\r\n    OR '${`검색_사용자ID`}' = 'All'\r\n    OR `프로필`.`사용자_ID` = '${`검색_사용자ID`}'\r\n  )\r\n),\r\n\r\n`정렬된_테이블` AS (\r\n  SELECT *\r\n  FROM `최종_테이블`\r\n  ORDER BY `마지막_seen_at` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n  `사용자_ID` AS `유저 ID`,\r\n  `계약_상태_마스크` AS `계약 상태`,\r\n  `유형_ID` AS `유형 ID`,\r\n  `전체_세션수` AS `총 세션 수`,\r\n  `전체_페이지_views` AS `총 PV`,\r\n  `평균_pv_per_세션` AS `세션당 평균 PV`,\r\n  `평균_세션_체류시간_초` AS `평균 세션 체류시간`,\r\n  `전체_searches` AS `검색 수`,\r\n  `전체_상품_clicks` AS `상품 클릭 수`,\r\n  `프로필_updated_시각` AS `프로필 업데이트 시각`,\r\n  `최초_seen_at` AS `최초 방문 시각`,\r\n  `마지막_seen_at` AS `마지막 방문 시각`,\r\n  `주요_플랫폼` AS `주 이용 플랫폼`,\r\n  `행사_날짜_예정` AS `예정 예식일`\r\nFROM `정렬된_테이블`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 5,
      "title": "2-4. 유저 마스터 정보 (Status Profile)",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 43,
        "w": 24,
        "h": 11,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "평균 세션 체류시간"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false,
            "tooltip": {
              "field": "계약 상태"
            }
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "light-yellow"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 세션 체류시간"
            },
            "properties": [
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "2-5": {
    "title": "2-5. 개인 행동 기반 추천 후보 (Behavior-based Recommendation Candidates)_개인 전용",
    "query": "WITH\r\n`기준데이터` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n    `클라이언트_시각`,\r\n    `이벤트_유형`,\r\n    `이벤트_명`,\r\n    `페이지_제목`,\r\n    `페이지_URL`,\r\n    `속성_JSON`,\r\n\r\n    JSONExtractString(`속성_JSON`, '`검색_카테고리`') AS `검색_카테고리`,\r\n    JSONExtractString(`속성_JSON`, '`검색_검색어`') AS `검색_검색어`,\r\n    JSONExtractString(`속성_JSON`, '`검색_결과_상품_ID`') AS `상품_ID`,\r\n\r\n    multiIf(\r\n      `이벤트_명` ILIKE '%웨딩홀%'\r\n        OR `페이지_제목` ILIKE '%웨딩홀%'\r\n        OR `검색_검색어` ILIKE '%웨딩홀%'\r\n        OR `검색_카테고리` ILIKE '%웨딩홀%'\r\n        OR `이벤트_명` ILIKE '%컨벤션%'\r\n        OR `이벤트_명` ILIKE '%채플%'\r\n        OR `이벤트_명` ILIKE '%호텔%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%',\r\n        '웨딩홀',\r\n\r\n      `이벤트_명` ILIKE '%스튜디오%'\r\n        OR `페이지_제목` ILIKE '%스튜디오%'\r\n        OR `검색_검색어` ILIKE '%스튜디오%'\r\n        OR `검색_카테고리` ILIKE '%스튜디오%'\r\n        OR `이벤트_명` ILIKE '%스튜디오%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%',\r\n        '스튜디오',\r\n\r\n      `이벤트_명` ILIKE '%드레스%'\r\n        OR `페이지_제목` ILIKE '%드레스%'\r\n        OR `검색_검색어` ILIKE '%드레스%'\r\n        OR `검색_카테고리` ILIKE '%드레스%'\r\n        OR `이벤트_명` ILIKE '%브라이드%'\r\n        OR `이벤트_명` ILIKE '%브라이덜%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%'\r\n        OR `이벤트_명` ILIKE '%카테고리_대표키워드%',\r\n        '드레스',\r\n\r\n      `이벤트_명` ILIKE '%헤어%'\r\n        OR `이벤트_명` ILIKE '%메이크업%'\r\n        OR `이벤트_명` ILIKE '%메이크%'\r\n        OR `이벤트_명` ILIKE '%뷰티%'\r\n        OR `페이지_제목` ILIKE '%헤어%'\r\n        OR `페이지_제목` ILIKE '%메이크업%'\r\n        OR `검색_검색어` ILIKE '%헤어%'\r\n        OR `검색_검색어` ILIKE '%메이크업%'\r\n        OR `검색_카테고리` ILIKE '%헤어%'\r\n        OR `검색_카테고리` ILIKE '%메이크업%',\r\n        '헤어·메이크업',\r\n\r\n      `이벤트_명` ILIKE '%혼수%'\r\n        OR `페이지_제목` ILIKE '%혼수%'\r\n        OR `검색_검색어` ILIKE '%혼수%'\r\n        OR `검색_카테고리` ILIKE '%혼수%',\r\n        '혼수',\r\n\r\n      `이벤트_명` ILIKE '%본식%'\r\n        OR `페이지_제목` ILIKE '%본식%'\r\n        OR `검색_검색어` ILIKE '%본식%'\r\n        OR `검색_카테고리` ILIKE '%본식%'\r\n        OR `이벤트_명` ILIKE '%부케%'\r\n        OR `이벤트_명` ILIKE '%영상%'\r\n        OR `이벤트_명` ILIKE '%영상%'\r\n        OR `검색_검색어` ILIKE '%부케%'\r\n        OR `검색_검색어` ILIKE '%영상%'\r\n        OR `검색_검색어` ILIKE '%영상%',\r\n        '본식상품',\r\n\r\n      `이벤트_명` ILIKE '%스냅%'\r\n        OR `페이지_제목` ILIKE '%스냅%'\r\n        OR `검색_검색어` ILIKE '%스냅%',\r\n        '스냅',\r\n\r\n      `이벤트_명` ILIKE '%쿠폰%'\r\n        OR `페이지_제목` ILIKE '%쿠폰%'\r\n        OR `이벤트_명` ILIKE '%혜택%'\r\n        OR `페이지_제목` ILIKE '%혜택%'\r\n        OR `이벤트_명` ILIKE '%페이백%'\r\n        OR `페이지_제목` ILIKE '%페이백%',\r\n        '혜택',\r\n\r\n      `상품_ID` != '',\r\n        '관심상품',\r\n\r\n      '기타'\r\n    ) AS `카테고리`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`페이지_흐름` AS (\r\n  SELECT\r\n    *,\r\n    greatest(\r\n      0,\r\n      least(\r\n        dateDiff(\r\n          'second',\r\n          `클라이언트_시각`,\r\n          leadInFrame(`클라이언트_시각`, 1, `클라이언트_시각`) OVER (\r\n            PARTITION BY `사용자_ID`, `세션_ID`\r\n            ORDER BY `클라이언트_시각` ASC\r\n            ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING\r\n          )\r\n        ),\r\n        600\r\n      )\r\n    ) AS `stay_초`\r\n  FROM `기준데이터`\r\n),\r\n\r\n`카테고리_원천` AS (\r\n  SELECT\r\n    `카테고리`,\r\n\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `페이지_views`,\r\n    countIf(`이벤트_유형` = '`검색`') AS `검색_수`,\r\n    countIf(`이벤트_유형` = '`상품카테고리`') AS `카테고리_views`,\r\n    countIf(`이벤트_유형` = '`상품클릭`') AS `상품_clicks`,\r\n    countIf(`상품_ID` != '') AS `상품_ID_행동수`,\r\n    round(sum(`stay_초`) / 60, 2) AS stay_minutes,\r\n\r\n    round(\r\n      least(countIf(`이벤트_유형` = '`페이지조회`') * 5, 25)\r\n      + least(countIf(`이벤트_유형` = '`검색`') * 5, 15)\r\n      + least(countIf(`이벤트_유형` = '`상품카테고리`') * 10, 20)\r\n      + least(countIf(`이벤트_유형` = '`상품클릭`') * 12.5, 25)\r\n      + least((sum(`stay_초`) / 60) * 3, 15),\r\n      2\r\n    ) AS `카테고리_관심도_100`\r\n\r\n  FROM `페이지_흐름`\r\n  WHERE `카테고리` != '기타'\r\n  GROUP BY `카테고리`\r\n),\r\n\r\n`항목_원천` AS (\r\n  SELECT\r\n    `카테고리`,\r\n\r\n    if(\r\n      `상품_ID` != '',\r\n      `상품_ID`,\r\n      concat('TEMP_', replaceRegexpAll(`이벤트_명`, '[^0-9A-Za-z가-힣_ -]', ''))\r\n    ) AS `항목_키`,\r\n\r\n    if(\r\n      `상품_ID` != '',\r\n      '로그 상품ID',\r\n      '임시ID'\r\n    ) AS `항목_ID_유형`,\r\n\r\n    if(\r\n      `이벤트_명` != '',\r\n      `이벤트_명`,\r\n      if(`상품_ID` != '', concat('상품ID ', `상품_ID`), '상품명 없음')\r\n    ) AS `항목_명`,\r\n\r\n    anyLast(`검색_검색어`) AS `마지막_검색_검색어`,\r\n    anyLast(`검색_카테고리`) AS `마지막_검색_카테고리`,\r\n\r\n    count() AS `항목_전체_행동수`,\r\n    countIf(`이벤트_유형` = '`상품클릭`') AS `항목_상품_clicks`,\r\n    countIf(`상품_ID` != '') AS `항목_상품_ID_행동수`,\r\n    countIf(`이벤트_유형` = '`일반클릭`') AS `항목_clicks`,\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `항목_페이지_views`,\r\n\r\n    max(`클라이언트_시각`) AS `마지막_항목_행동_at`,\r\n\r\n    multiIf(\r\n      max(`클라이언트_시각`) >= now() - INTERVAL 7 DAY, 20,\r\n      max(`클라이언트_시각`) >= now() - INTERVAL 14 DAY, 12,\r\n      max(`클라이언트_시각`) >= now() - INTERVAL 30 DAY, 5,\r\n      0\r\n    ) AS `최근성_점수`,\r\n\r\n    round(\r\n      least(countIf(`이벤트_유형` = '`상품클릭`') * 20, 40)\r\n      + least(countIf(`상품_ID` != '') * 12.5, 25)\r\n      + least(countIf(`이벤트_유형` = '`일반클릭`') * 5, 15)\r\n      + multiIf(\r\n          max(`클라이언트_시각`) >= now() - INTERVAL 7 DAY, 20,\r\n          max(`클라이언트_시각`) >= now() - INTERVAL 14 DAY, 12,\r\n          max(`클라이언트_시각`) >= now() - INTERVAL 30 DAY, 5,\r\n          0\r\n        ),\r\n      2\r\n    ) AS `항목_관심도_100`\r\n\r\n  FROM `페이지_흐름`\r\n  WHERE `카테고리` != '기타'\r\n    AND (\r\n      `상품_ID` != ''\r\n      OR `이벤트_유형` IN ('`상품클릭`', '`일반클릭`', '`검색결과클릭`')\r\n    )\r\n    AND `이벤트_명` != ''\r\n  GROUP BY\r\n    `카테고리`,\r\n    `항목_키`,\r\n    `항목_ID_유형`,\r\n    `항목_명`\r\n),\r\n\r\nranked_items AS (\r\n  SELECT\r\n    *,\r\n    row_number() OVER (\r\n      PARTITION BY `카테고리`\r\n      ORDER BY `항목_관심도_100` DESC, `마지막_항목_행동_at` DESC\r\n    ) AS `항목_rank`\r\n  FROM `항목_원천`\r\n),\r\n\r\n`최종_테이블` AS (\r\n  SELECT\r\n    `카테고리요약`.`카테고리` AS `카테고리`,\r\n    `카테고리요약`.`카테고리_관심도_100` AS `카테고리_관심도_100`,\r\n\r\n    multiIf(\r\n      `카테고리요약`.`카테고리_관심도_100` >= 80, '매우 높음',\r\n      `카테고리요약`.`카테고리_관심도_100` >= 60, '높음',\r\n      `카테고리요약`.`카테고리_관심도_100` >= 40, '보통',\r\n      `카테고리요약`.`카테고리_관심도_100` >= 20, '낮음',\r\n      '매우 낮음'\r\n    ) AS `카테고리_관심도_수준`,\r\n\r\n    `항목요약`.`항목_명` AS `항목_명`,\r\n    `항목요약`.`항목_키` AS `항목_키`,\r\n    `항목요약`.`항목_ID_유형` AS `항목_ID_유형`,\r\n    `항목요약`.`항목_관심도_100` AS `항목_관심도_100`,\r\n\r\n    multiIf(\r\n      `항목요약`.`항목_관심도_100` >= 80, '매우 높음',\r\n      `항목요약`.`항목_관심도_100` >= 60, '높음',\r\n      `항목요약`.`항목_관심도_100` >= 40, '보통',\r\n      `항목요약`.`항목_관심도_100` >= 20, '낮음',\r\n      '매우 낮음'\r\n    ) AS `항목_관심도_수준`,\r\n\r\n    `카테고리요약`.`페이지_views` AS `페이지_views`,\r\n    `카테고리요약`.`검색_수` AS `검색_수`,\r\n    `카테고리요약`.`카테고리_views` AS `카테고리_views`,\r\n    `카테고리요약`.`상품_clicks` AS `상품_clicks`,\r\n    `카테고리요약`.`상품_ID_행동수` AS `상품_ID_행동수`,\r\n    `카테고리요약`.stay_minutes AS stay_minutes,\r\n\r\n    `항목요약`.`항목_전체_행동수` AS `항목_전체_행동수`,\r\n    `항목요약`.`항목_상품_clicks` AS `항목_상품_clicks`,\r\n    `항목요약`.`항목_상품_ID_행동수` AS `항목_상품_ID_행동수`,\r\n    `항목요약`.`항목_clicks` AS `항목_clicks`,\r\n    `항목요약`.`최근성_점수` AS `최근성_점수`,\r\n\r\n    `항목요약`.`마지막_검색_검색어` AS `마지막_검색_검색어`,\r\n    `항목요약`.`마지막_검색_카테고리` AS `마지막_검색_카테고리`,\r\n    `항목요약`.`마지막_항목_행동_at` AS `마지막_항목_행동_at`\r\n\r\n  FROM `카테고리_원천` `카테고리요약`\r\n  LEFT JOIN `순위_항목` `항목요약`\r\n    ON `카테고리요약`.`카테고리` = `항목요약`.`카테고리`\r\n   AND `항목요약`.`항목_rank` = 1\r\n)\r\n\r\nSELECT\r\n  row_number() OVER (\r\n    ORDER BY `카테고리_관심도_100` DESC, `항목_관심도_100` DESC\r\n  ) AS `추천 순위`,\r\n\r\n  `카테고리` AS `추천 카테고리`,\r\n  `카테고리_관심도_100` AS `카테고리 관심도(100점)`,\r\n  `카테고리_관심도_수준` AS `카테고리 관심 수준`,\r\n\r\n  `항목_명` AS `관심 상품 후보`,\r\n  `항목_키` AS `상품 식별값`,\r\n  `항목_ID_유형` AS `식별값 유형`,\r\n  `항목_관심도_100` AS `상품 관심도(100점)`,\r\n  `항목_관심도_수준` AS `상품 관심 수준`,\r\n\r\n  `페이지_views` AS `카테고리 PV`,\r\n  `검색_수` AS `검색 수`,\r\n  `카테고리_views` AS `카테고리 진입 수`,\r\n  `상품_clicks` AS `상품 클릭 수`,\r\n  `상품_ID_행동수` AS `상품ID 포함 행동 수`,\r\n  stay_minutes AS `카테고리 체류시간(분)`,\r\n\r\n  `항목_전체_행동수` AS `상품 관련 행동 수`,\r\n  `항목_상품_clicks` AS `상품 클릭 행동 수`,\r\n  `항목_상품_ID_행동수` AS `상품ID 행동 수`,\r\n  `항목_clicks` AS `일반 클릭 수`,\r\n  `최근성_점수` AS `최근성 점수`,\r\n\r\n  `마지막_검색_검색어` AS `최근 검색어`,\r\n  `마지막_검색_카테고리` AS `최근 검색 카테고리`,\r\n  `마지막_항목_행동_at` AS `마지막 관심 시각`\r\n\r\nFROM `최종_테이블`\r\nORDER BY\r\n  `추천 순위` ASC\r\nLIMIT 5;",
    "panelSpec": {
      "kind": "Panel",
      "id": 6,
      "title": "2-5. 개인 행동 기반 추천 후보 (Behavior-based Recommendation Candidates)_개인 전용",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 54,
        "w": 24,
        "h": 12,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "카테고리 관심도(100점)",
        "상품 관심도(100점)",
        "마지막 관심 시각"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 80,
                "color": "green"
              }
            ]
          },
          "decimals": 0,
          "color": {
            "mode": "continuous-RdYlGr"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "카테고리 관심도(100점)"
            },
            "properties": [
              {
                "id": "unit"
              },
              {
                "id": "decimals",
                "value": 0
              },
              {
                "id": "min",
                "value": 0
              },
              {
                "id": "max",
                "value": 100
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "lcd",
                  "type": "gauge",
                  "valueDisplayMode": "color"
                }
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "red",
                      "value": null
                    },
                    {
                      "color": "orange",
                      "value": 20
                    },
                    {
                      "color": "yellow",
                      "value": 40
                    },
                    {
                      "color": "green",
                      "value": 60
                    },
                    {
                      "color": "blue",
                      "value": 80
                    }
                  ]
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "상품 관심도(100점)"
            },
            "properties": [
              {
                "id": "unit"
              },
              {
                "id": "decimals",
                "value": 0
              },
              {
                "id": "min",
                "value": 0
              },
              {
                "id": "max",
                "value": 100
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "lcd",
                  "type": "gauge",
                  "valueDisplayMode": "color"
                }
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "red",
                      "value": null
                    },
                    {
                      "color": "orange",
                      "value": 20
                    },
                    {
                      "color": "yellow",
                      "value": 40
                    },
                    {
                      "color": "green",
                      "value": 60
                    },
                    {
                      "color": "blue",
                      "value": 80
                    }
                  ]
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "마지막 관심 시각"
            },
            "properties": [
              {
                "id": "unit",
                "value": "dateTimeAsSystem"
              },
              {
                "id": "decimals",
                "value": 0
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "auto"
                }
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "2-6": {
    "title": "2-6. 유저 세션별 페이지 이동 경로 (User Session Page Journey)_개인 전용",
    "query": "SELECT\r\n    `세션_ID`,\r\n    `진입_시간` AS \"진입 시간 (`진입`)\",\r\n    `이탈_시간` AS \"이탈 시간 (`이탈`)\",\r\n    multiIf(\r\n      `전체_체류시간_초` < 60,\r\n        concat(toString(`전체_체류시간_초`), '초'),\r\n      `전체_체류시간_초` < 3600,\r\n        concat(\r\n          toString(intDiv(`전체_체류시간_초`, 60)), '분 ',\r\n          toString(modulo(`전체_체류시간_초`, 60)), '초'\r\n        ),\r\n      concat(\r\n        toString(intDiv(`전체_체류시간_초`, 3600)), '시간 ',\r\n        toString(intDiv(modulo(`전체_체류시간_초`, 3600), 60)), '분 ',\r\n        toString(modulo(`전체_체류시간_초`, 60)), '초'\r\n      )\r\n    ) AS \"세션 총 체류시간 (`전체` `체류시간`)\",\r\n    arrayStringConcat(\r\n      groupArray(concat(`페이지_제목`, ' (', `페이지_체류시간_text`, ')')),\r\n      ' ➔ '\r\n    ) AS \"페이지별 체류 흐름 상세 (Timeline `흐름`)\",\r\n    arrayStringConcat(\r\n      groupArray(`페이지_URL`),\r\n      ' \\n➔ '\r\n    ) AS \"URL 이동 경로 (URL `경로`)\"\r\nFROM (\r\n    SELECT\r\n        `세션_ID`,\r\n        `클라이언트_시각`,\r\n        min(`클라이언트_시각`) OVER (PARTITION BY `세션_ID`) AS `진입_시간`,\r\n        max(`클라이언트_시각`) OVER (PARTITION BY `세션_ID`) AS `이탈_시간`,\r\n        dateDiff(\r\n          'second',\r\n          min(`클라이언트_시각`) OVER (PARTITION BY `세션_ID`),\r\n          max(`클라이언트_시각`) OVER (PARTITION BY `세션_ID`)\r\n        ) AS `전체_체류시간_초`,\r\n        if(empty(`페이지_제목`), 'Unknown `페이지`', `페이지_제목`) AS `페이지_제목`,\r\n        `페이지_URL`,\r\n        `페이지_체류시간_초`,\r\n        multiIf(\r\n          `페이지_체류시간_초` < 60,\r\n            concat(toString(`페이지_체류시간_초`), '초'),\r\n          `페이지_체류시간_초` < 3600,\r\n            concat(\r\n              toString(intDiv(`페이지_체류시간_초`, 60)), '분 ',\r\n              toString(modulo(`페이지_체류시간_초`, 60)), '초'\r\n            ),\r\n          concat(\r\n            toString(intDiv(`페이지_체류시간_초`, 3600)), '시간 ',\r\n            toString(intDiv(modulo(`페이지_체류시간_초`, 3600), 60)), '분 ',\r\n            toString(modulo(`페이지_체류시간_초`, 60)), '초'\r\n          )\r\n        ) AS `페이지_체류시간_text`\r\n    FROM (\r\n        SELECT\r\n            `세션_ID`,\r\n            `클라이언트_시각`,\r\n            `페이지_제목`,\r\n            `페이지_URL`,\r\n            dateDiff(\r\n              'second',\r\n              `클라이언트_시각`,\r\n              leadInFrame(`클라이언트_시각`, 1, `클라이언트_시각`) OVER (\r\n                PARTITION BY `세션_ID`\r\n                ORDER BY `클라이언트_시각` ASC\r\n                ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING\r\n              )\r\n            ) AS `페이지_체류시간_초`\r\n        FROM 행동 이벤트 테이블\r\n        WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n          AND `사용자_ID` = '${`검색_사용자ID`}'\r\n          AND `세션_ID` != ''\r\n          AND `페이지_URL` != ''\r\n        ORDER BY `세션_ID`, `클라이언트_시각` ASC\r\n    )\r\n)\r\nGROUP BY\r\n    `세션_ID`,\r\n    `진입_시간`,\r\n    `이탈_시간`,\r\n    `전체_체류시간_초`\r\nORDER BY \"진입 시간 (`진입`)\" DESC",
    "panelSpec": {
      "kind": "Panel",
      "id": 14,
      "title": "2-6. 유저 세션별 페이지 이동 경로 (User Session Page Journey)_개인 전용",
      "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
      "gridPos": {
        "x": 0,
        "y": 66,
        "w": 24,
        "h": 14,
        "row": "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "세션 총 체류시간 (`전체` `체류시간`)",
        "URL 이동 경로 (URL `경로`)",
        "페이지별 체류 흐름 상세 (Timeline `흐름`)",
        "URL 이동 경로 (URL `경로`)",
        "세션 총 체류시간 (`전체` `체류시간`)"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "세션 총 체류시간 (`전체` `체류시간`)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "dtdurations"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "URL 이동 경로 (URL `경로`)"
            },
            "properties": [
              {
                "id": "links"
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "페이지별 체류 흐름 상세 (Timeline `흐름`)"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 500
              },
              {
                "id": "custom.wrapText",
                "value": true
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "URL 이동 경로 (URL `경로`)"
            },
            "properties": [
              {
                "id": "custom.width",
                "value": 500
              },
              {
                "id": "custom.wrapText",
                "value": true
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "세션 총 체류시간 (`전체` `체류시간`)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "dthms"
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "3-1": {
    "title": "3-1. 페이지별 세션당 평균 조회수(Pages by Views per Session)",
    "query": "WITH\r\n`페이지_요약` AS (\r\n  SELECT\r\n    if(`페이지_제목` = '', `이벤트_명`, `페이지_제목`) AS `페이지_제목_명`,\r\n    `페이지_URL` AS `페이지_URL`,\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `전체_pv`,\r\n    countDistinctIf(`세션_ID`, `이벤트_유형` = '`페이지조회`') AS `view_세션수`,\r\n    countDistinctIf(`사용자_ID`, `이벤트_유형` = '`페이지조회`') AS `고유_users`,\r\n    round(\r\n      countIf(`이벤트_유형` = '`페이지조회`')\r\n      / nullIf(countDistinctIf(`세션_ID`, `이벤트_유형` = '`페이지조회`'), 0),\r\n      2\r\n    ) AS `평균_pv_per_세션`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND `페이지_URL` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY\r\n    `페이지_제목_명`,\r\n    `페이지_URL`\r\n),\r\n\r\n`정렬된_페이지` AS (\r\n  SELECT\r\n    *\r\n  FROM `페이지_요약`\r\n  WHERE `view_세션수` > 5\r\n  ORDER BY\r\n    `평균_pv_per_세션` DESC,\r\n    `전체_pv` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n  `페이지_제목_명` AS `페이지 제목`,\r\n  `페이지_URL` AS `페이지 URL`,\r\n  `전체_pv` AS `총 PV`,\r\n  `view_세션수` AS `조회 세션 수`,\r\n  `고유_users` AS `순방문자 수`,\r\n  `평균_pv_per_세션` AS `세션당 평균 PV`\r\nFROM `정렬된_페이지`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 13,
      "title": "3-1. 페이지별 세션당 평균 조회수(Pages by Views per Session)",
      "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)",
      "gridPos": {
        "x": 0,
        "y": 0,
        "w": 24,
        "h": 14,
        "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "세션당 평균 PV",
        "페이지 제목",
        "페이지 URL"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "세션당 평균 PV"
            },
            "properties": [
              {
                "id": "decimals",
                "value": 1
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-text"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "페이지 제목"
            },
            "properties": []
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "페이지 URL"
            },
            "properties": [
              {
                "id": "links",
                "value": [
                  {
                    "targetBlank": true,
                    "title": "페이지 열기",
                    "url": "${__data.fields[\"페이지 URL\"]}"
                  }
                ]
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm",
        "sortBy": []
      },
      "transformations": []
    }
  },
  "3-2": {
    "title": "3-2. 진입/이탈 페이지 분석 (Entry & Exit)",
    "query": "WITH `세션_페이지` AS (\r\n  SELECT\r\n    `세션_ID`,\r\n    argMin(`페이지_URL`, `클라이언트_시각`) AS `진입_페이지`,\r\n    argMin(`페이지_제목`, `클라이언트_시각`) AS `진입_페이지_제목`,\r\n    argMax(`페이지_URL`, `클라이언트_시각`) AS `이탈_페이지`,\r\n    argMax(`페이지_제목`, `클라이언트_시각`) AS `이탈_페이지_제목`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND `페이지_URL` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY\r\n    `세션_ID`\r\n)\r\n\r\nSELECT\r\n  `페이지_제목` AS \"페이지 제목\",\r\n  `페이지_URL` AS \"페이지 URL\",\r\n  sum(`is_진입`) AS \"진입 수\",\r\n  sum(`is_이탈`) AS \"이탈 수\",\r\n  sum(`is_진입`) + sum(`is_이탈`) AS \"총 진입/이탈 수\"\r\nFROM (\r\n  SELECT\r\n    `진입_페이지_제목` AS `페이지_제목`,\r\n    `진입_페이지` AS `페이지_URL`,\r\n    1 AS `is_진입`,\r\n    0 AS `is_이탈`\r\n  FROM `세션_페이지`\r\n  WHERE `진입_페이지` != ''\r\n\r\n  UNION ALL\r\n\r\n  SELECT\r\n    `이탈_페이지_제목` AS `페이지_제목`,\r\n    `이탈_페이지` AS `페이지_URL`,\r\n    0 AS `is_진입`,\r\n    1 AS `is_이탈`\r\n  FROM `세션_페이지`\r\n  WHERE `이탈_페이지` != ''\r\n)\r\nGROUP BY\r\n  `페이지_제목`,\r\n  `페이지_URL`\r\nORDER BY \"총 진입/이탈 수\" DESC\r\nLIMIT 30",
    "panelSpec": {
      "kind": "Panel",
      "id": 8,
      "title": "3-2. 진입/이탈 페이지 분석 (Entry & Exit)",
      "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)",
      "gridPos": {
        "x": 0,
        "y": 14,
        "w": 24,
        "h": 17,
        "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)"
      },
      "visualization": "barchart",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "lineWidth": 1,
            "fillOpacity": 80,
            "gradientMode": "none",
            "axisPlacement": "auto",
            "axisLabel": "",
            "axisColorMode": "text",
            "axisBorderShow": false,
            "scaleDistribution": {
              "type": "linear"
            },
            "axisCenteredZero": false,
            "hideFrom": {
              "tooltip": false,
              "viz": false,
              "legend": false
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "color": {
            "mode": "palette-classic"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          },
          "links": [
            {
              "targetBlank": true,
              "title": "페이지 열기",
              "url": "${__data.fields[\"페이지 URL\"]}"
            }
          ]
        },
        "overrides": []
      },
      "options": {
        "orientation": "horizontal",
        "xTickLabelRotation": 0,
        "xTickLabelSpacing": 0,
        "showValue": "auto",
        "stacking": "none",
        "groupWidth": 0.7,
        "barWidth": 0.97,
        "barRadius": 0,
        "fullHighlight": false,
        "tooltip": {
          "mode": "single",
          "sort": "none",
          "hideZeros": false
        },
        "legend": {
          "showLegend": true,
          "displayMode": "list",
          "placement": "bottom",
          "calcs": []
        }
      },
      "transformations": []
    }
  },
  "3-3": {
    "title": "3-3. 페이지별 스크롤 탐색 깊이(Pages by Scroll Engagement)",
    "query": "WITH\r\n`페이지_스크롤_기준데이터` AS (\r\n  SELECT\r\n    if(`페이지_제목` = '', `이벤트_명`, `페이지_제목`) AS `페이지_제목_명`,\r\n    max(`페이지_URL`) AS `representative_페이지_URL`,\r\n\r\n    countIf(`이벤트_유형` = '`페이지조회`') AS `전체_views`,\r\n\r\n    countIf(\r\n      `이벤트_유형` = '`페이지조회`'\r\n      AND `스크롤_깊이_pct` > 1\r\n    ) AS `스크롤_이벤트_수`,\r\n\r\n    countDistinctIf(\r\n      `세션_ID`,\r\n      `이벤트_유형` = '`페이지조회`'\r\n    ) AS `view_세션수`,\r\n\r\n    countDistinctIf(\r\n      `세션_ID`,\r\n      `이벤트_유형` = '`페이지조회`'\r\n      AND `스크롤_깊이_pct` > 1\r\n    ) AS `스크롤_세션수`,\r\n\r\n    round(\r\n      countDistinctIf(\r\n        `세션_ID`,\r\n        `이벤트_유형` = '`페이지조회`'\r\n        AND `스크롤_깊이_pct` > 1\r\n      )\r\n      / nullIf(\r\n          countDistinctIf(\r\n            `세션_ID`,\r\n            `이벤트_유형` = '`페이지조회`'\r\n          ),\r\n          0\r\n        )\r\n      * 100,\r\n      2\r\n    ) AS `스크롤_세션_비율`,\r\n\r\n    round(\r\n      avgIf(\r\n        `스크롤_깊이_pct`,\r\n        `이벤트_유형` = '`페이지조회`'\r\n        AND `스크롤_깊이_pct` > 1\r\n      ),\r\n      2\r\n    ) AS `평균_스크롤_깊이`,\r\n\r\n    quantileIf(0.5)(\r\n      `스크롤_깊이_pct`,\r\n      `이벤트_유형` = '`페이지조회`'\r\n      AND `스크롤_깊이_pct` > 1\r\n    ) AS `중앙값_스크롤_깊이`,\r\n\r\n    countDistinctIf(\r\n      `세션_ID`,\r\n      `이벤트_유형` = '`페이지조회`'\r\n      AND `스크롤_깊이_pct` >= 70\r\n    ) AS `깊은_스크롤_세션수`,\r\n\r\n    round(\r\n      countDistinctIf(\r\n        `세션_ID`,\r\n        `이벤트_유형` = '`페이지조회`'\r\n        AND `스크롤_깊이_pct` >= 70\r\n      )\r\n      / nullIf(\r\n          countDistinctIf(\r\n            `세션_ID`,\r\n            `이벤트_유형` = '`페이지조회`'\r\n            AND `스크롤_깊이_pct` > 1\r\n          ),\r\n          0\r\n        )\r\n      * 100,\r\n      2\r\n    ) AS `깊은_스크롤_비율`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `페이지_URL` != ''\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY `페이지_제목_명`\r\n),\r\n\r\n`정렬된_페이지` AS (\r\n  SELECT\r\n    *\r\n  FROM `페이지_스크롤_기준데이터`\r\n  WHERE `전체_views` > 0\r\n  ORDER BY\r\n    `전체_views` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n  `페이지_제목_명` AS `페이지 제목`,\r\n  `representative_페이지_URL` AS `페이지 URL`,\r\n  `전체_views` AS `전체 조회수`,\r\n  `스크롤_이벤트_수` AS `스크롤 발생 이벤트 수`,\r\n  `view_세션수` AS `조회 세션 수`,\r\n  `스크롤_세션수` AS `스크롤 세션 수`,\r\n  `스크롤_세션_비율` AS `스크롤 발생 세션 비율`,\r\n  `평균_스크롤_깊이` AS `평균 스크롤 깊이`,\r\n  `중앙값_스크롤_깊이` AS `중앙값 스크롤 깊이`,\r\n  `깊은_스크롤_세션수` AS `깊은 탐색 세션 수`,\r\n  `깊은_스크롤_비율` AS `깊은 탐색 비율`\r\nFROM `정렬된_페이지`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 11,
      "title": "3-3. 페이지별 스크롤 탐색 깊이(Pages by Scroll Engagement)",
      "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)",
      "gridPos": {
        "x": 0,
        "y": 31,
        "w": 24,
        "h": 16,
        "row": "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "페이지 URL",
        "스크롤 발생 세션 비율",
        "평균 스크롤 깊이",
        "깊은 탐색 비율"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "yellow"
              },
              {
                "value": 75,
                "color": "green"
              },
              {
                "value": 100,
                "color": "blue"
              }
            ]
          },
          "min": 0,
          "max": 100,
          "color": {
            "mode": "continuous-RdYlGr"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "페이지 URL"
            },
            "properties": [
              {
                "id": "links",
                "value": [
                  {
                    "targetBlank": true,
                    "title": "페이지 열기",
                    "url": "${__data.fields[\"페이지 URL\"]}"
                  }
                ]
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "스크롤 발생 세션 비율"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "lcd",
                  "type": "gauge",
                  "valueDisplayMode": "color"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 스크롤 깊이"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "lcd",
                  "type": "gauge",
                  "valueDisplayMode": "color"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "깊은 탐색 비율"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "lcd",
                  "type": "gauge",
                  "valueDisplayMode": "color"
                }
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm",
        "sortBy": [
          {
            "desc": true,
            "displayName": "개선대상 지수"
          }
        ]
      },
      "transformations": []
    }
  },
  "4-1": {
    "title": "4-1. 이벤트 유형별 발생 수 (Event Type Distribution)",
    "query": "SELECT\r\n  CASE `이벤트_유형`\r\n    WHEN '`페이지조회`' THEN '페이지 조회'\r\n    WHEN '`버튼클릭`' THEN '버튼 클릭'\r\n    WHEN '`상품클릭`' THEN '상품 클릭'\r\n    WHEN '`검색`' THEN '검색'\r\n    WHEN '`콘텐츠댓글`' THEN '콘텐츠 댓글'\r\n    WHEN '`상품카테고리`' THEN '상품 카테고리'\r\n    WHEN '`검색결과클릭`' THEN '검색 결과 클릭'\r\n    WHEN '`일반클릭`' THEN '일반 클릭'\r\n    WHEN '`이미지클릭`' THEN '이미지 클릭'\r\n    WHEN '`콘텐츠공유`' THEN '콘텐츠 공유'\r\n    WHEN '`콘텐츠좋아요`' THEN '콘텐츠 좋아요'\r\n    ELSE `이벤트_유형`\r\n  END AS \"이벤트 유형\",\r\n  count() AS \"이벤트 수\",\r\n  countDistinct(`사용자_ID`) AS \"유저 수\",\r\n  countDistinct(`세션_ID`) AS \"세션 수\",\r\n  round(count() / nullIf(sum(count()) OVER (), 0) * 100, 2) AS \"이벤트 비중\"\r\nFROM 행동 이벤트 테이블\r\nWHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n  AND (\r\n    '${`검색_사용자ID`}' = ''\r\n    OR '${`검색_사용자ID`}' = 'All'\r\n    OR `사용자_ID` = '${`검색_사용자ID`}'\r\n  )\r\nGROUP BY `이벤트_유형`\r\nORDER BY \"이벤트 수\" DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 9,
      "title": "4-1. 이벤트 유형별 발생 수 (Event Type Distribution)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 0,
        "w": 24,
        "h": 17,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "barchart",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "lineWidth": 1,
            "fillOpacity": 70,
            "gradientMode": "hue",
            "axisPlacement": "auto",
            "axisLabel": "",
            "axisColorMode": "text",
            "axisBorderShow": false,
            "scaleDistribution": {
              "type": "linear"
            },
            "axisCenteredZero": false,
            "hideFrom": {
              "tooltip": false,
              "viz": false,
              "legend": false
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "color": {
            "mode": "palette-classic"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": []
      },
      "options": {
        "orientation": "horizontal",
        "xTickLabelRotation": 0,
        "xTickLabelSpacing": 0,
        "showValue": "auto",
        "stacking": "normal",
        "groupWidth": 0.7,
        "barWidth": 0.85,
        "barRadius": 0.05,
        "fullHighlight": false,
        "tooltip": {
          "mode": "multi",
          "sort": "desc",
          "hideZeros": false
        },
        "legend": {
          "showLegend": true,
          "displayMode": "list",
          "placement": "bottom",
          "calcs": []
        }
      },
      "transformations": []
    }
  },
  "4-2": {
    "title": "4-2. 검색어 및 무결과율 (Search Keywords & Zero-result Rate)",
    "query": "SELECT\r\n  JSONExtractString(`속성_JSON`, '`검색_카테고리`') AS \"검색 카테고리\",\r\n  JSONExtractString(`속성_JSON`, '`검색_검색어`') AS \"검색어\",\r\n  count() AS \"검색 수\",\r\n  countDistinct(`사용자_ID`) AS \"검색 유저 수\",\r\n  countDistinct(`세션_ID`) AS \"검색 세션 수\",\r\n  avg(JSONExtractUInt(`속성_JSON`, '`검색_결과_수`')) AS \"평균 검색 결과 수\",\r\n  countIf(JSONExtractUInt(`속성_JSON`, '`검색_결과_수`') = 0) AS \"무결과 수\",\r\n  round(\"무결과 수\" / nullIf(\"검색 수\", 0) * 100, 2) AS \"무결과율\"\r\nFROM 행동 이벤트 테이블\r\nWHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n  AND `이벤트_유형` = '`검색`'\r\n  AND JSONExtractString(`속성_JSON`, '`검색_검색어`') != ''\r\n  AND (\r\n    '${`검색_사용자ID`}' = ''\r\n    OR '${`검색_사용자ID`}' = 'All'\r\n    OR `사용자_ID` = '${`검색_사용자ID`}'\r\n  )\r\nGROUP BY \"검색 카테고리\", \"검색어\"\r\nORDER BY \"검색 수\" DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 18,
      "title": "4-2. 검색어 및 무결과율 (Search Keywords & Zero-result Rate)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 17,
        "w": 24,
        "h": 15,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "무결과율"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "무결과율"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "mode": "gradient",
                  "type": "color-background"
                }
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "blue",
                      "value": null
                    },
                    {
                      "color": "green",
                      "value": 25
                    },
                    {
                      "color": "orange",
                      "value": 50
                    },
                    {
                      "color": "red",
                      "value": 100
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-3": {
    "title": "4-3. 고객 타입별 검색어(Search Keywords by Customer Type)",
    "query": "WITH `프로필_목록` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `유형_ID`,\r\n    `positional_키`\r\n  FROM 고객 프로필 테이블\r\n  WHERE `사용자_ID` != ''\r\n),\r\n\r\n`유형_labels` AS (\r\n  SELECT\r\n    `유형_ID`,\r\n    any(`segment_명_ko`) AS `segment_명_ko`\r\n  FROM 분석용 테이블\r\n  GROUP BY `유형_ID`\r\n),\r\n\r\n`검색_요약` AS (\r\n  SELECT\r\n    `프로필`.`유형_ID` AS `유형_ID`,\r\n    `프로필`.`positional_키` AS `positional_키`,\r\n    `유형라벨`.`segment_명_ko` AS `segment_명_ko`,\r\n\r\n    JSONExtractString(`행동`.`속성_JSON`, '`검색_카테고리`') AS `검색_카테고리`,\r\n    JSONExtractString(`행동`.`속성_JSON`, '`검색_검색어`') AS `검색_검색어`,\r\n\r\n    count() AS `검색_수`,\r\n    countDistinct(`행동`.`사용자_ID`) AS `사용자_수`,\r\n    countDistinct(`행동`.`세션_ID`) AS `세션_수`,\r\n    avg(JSONExtractUInt(`행동`.`속성_JSON`, '`검색_결과_수`')) AS `평균_검색_결과_수`\r\n\r\n  FROM 행동 이벤트 테이블 `행동`\r\n\r\n  LEFT JOIN `프로필_목록` `프로필`\r\n    ON `행동`.`사용자_ID` = `프로필`.`사용자_ID`\r\n\r\n  LEFT JOIN `유형_labels` `유형라벨`\r\n    ON `프로필`.`유형_ID` + 1 = `유형라벨`.`유형_ID`\r\n\r\n  WHERE $`timeFilter_밀리초`(`행동`.`클라이언트_시각`)\r\n    AND `행동`.`이벤트_유형` = '`검색`'\r\n    AND JSONExtractString(`행동`.`속성_JSON`, '`검색_검색어`') != ''\r\n\r\n  GROUP BY\r\n    `프로필`.`유형_ID`,\r\n    `프로필`.`positional_키`,\r\n    `유형라벨`.`segment_명_ko`,\r\n    `검색_카테고리`,\r\n    `검색_검색어`\r\n),\r\n\r\n`정렬된_searches` AS (\r\n  SELECT\r\n    *\r\n  FROM `검색_요약`\r\n  ORDER BY `검색_수` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n\r\n  concat(\r\n    'T',\r\n    toString(ifNull(`유형_ID`, 0) + 1),\r\n    ' - ',\r\n    ifNull(`positional_키`, '-'),\r\n    ' - ',\r\n    ifNull(`segment_명_ko`, '미분류')\r\n  ) AS `고객 타입`,\r\n\r\n  `검색_카테고리` AS `검색 카테고리`,\r\n  `검색_검색어` AS `검색어`,\r\n  `검색_수` AS `검색 수`,\r\n  `사용자_수` AS `검색 유저 수`,\r\n  `세션_수` AS `검색 세션 수`,\r\n  round(`평균_검색_결과_수`, 2) AS `평균 검색 결과 수`\r\n\r\nFROM `정렬된_searches`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 19,
      "title": "4-3. 고객 타입별 검색어(Search Keywords by Customer Type)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 32,
        "w": 24,
        "h": 18,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "평균 검색 결과 수",
        "고객 타입",
        "순번"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "red"
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 검색 결과 수"
            },
            "properties": [
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "red",
                      "value": null
                    },
                    {
                      "color": "transparent",
                      "value": 1
                    }
                  ]
                }
              },
              {
                "id": "decimals",
                "value": 2
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "고객 타입"
            },
            "properties": [
              {
                "id": "custom.minWidth",
                "value": 300
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "순번"
            },
            "properties": [
              {
                "id": "custom.minWidth",
                "value": 50
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-4": {
    "title": "4-4. CTA·버튼·배너 클릭(CTA, Button & Banner Clicks)",
    "query": "WITH `클릭_기준데이터` AS (\r\n  SELECT\r\n    `이벤트_유형`,\r\n    `이벤트_명`,\r\n    `속성_JSON`,\r\n    `사용자_ID`,\r\n    `세션_ID`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `이벤트_유형` IN ('`버튼클릭`', '`일반클릭`', '`이미지클릭`')\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`클릭_요약` AS (\r\n  SELECT\r\n    `이벤트_유형`,\r\n    `이벤트_명`,\r\n    JSONExtractString(`속성_JSON`, '`검색_카테고리`') AS `검색_카테고리`,\r\n    JSONExtractString(`속성_JSON`, '`검색_검색어`') AS `검색_검색어`,\r\n    JSONExtractString(`속성_JSON`, '`검색_결과_상품_ID`') AS `검색_결과_상품_ID`,\r\n    JSONExtractString(`속성_JSON`, '`상태`') AS `스크랩_상태`,\r\n    count() AS `클릭_수`,\r\n    countDistinct(`사용자_ID`) AS `사용자_수`,\r\n    countDistinct(`세션_ID`) AS `세션_수`\r\n  FROM `클릭_기준데이터`\r\n  GROUP BY\r\n    `이벤트_유형`,\r\n    `이벤트_명`,\r\n    `검색_카테고리`,\r\n    `검색_검색어`,\r\n    `검색_결과_상품_ID`,\r\n    `스크랩_상태`\r\n),\r\n\r\n`정렬된_clicks` AS (\r\n  SELECT\r\n    *\r\n  FROM `클릭_요약`\r\n  ORDER BY `클릭_수` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n  `이벤트_유형` AS `이벤트 타입`,\r\n  `이벤트_명` AS `클릭 대상`,\r\n  if(`검색_카테고리` = '', '-', `검색_카테고리`) AS `검색 카테고리`,\r\n  if(`검색_검색어` = '', '-', `검색_검색어`) AS `검색어`,\r\n  if(`검색_결과_상품_ID` = '', '-', `검색_결과_상품_ID`) AS `검색 결과 상품 ID`,\r\n  if(`스크랩_상태` = '', '-', `스크랩_상태`) AS `스크랩 상태`,\r\n  `클릭_수` AS `클릭 수`,\r\n  `사용자_수` AS `유저 수`,\r\n  `세션_수` AS `세션 수`\r\nFROM `정렬된_clicks`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 20,
      "title": "4-4. CTA·버튼·배너 클릭(CTA, Button & Banner Clicks)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 50,
        "w": 24,
        "h": 14,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          },
          "color": {
            "mode": "thresholds"
          }
        },
        "overrides": []
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-5": {
    "title": "4-5. 상품·업체 클릭(Product & Vendor Clicks)",
    "query": "WITH `상품_클릭_요약` AS (\r\n  SELECT\r\n    `이벤트_명` AS `상품_명`,\r\n    count() AS `상품_클릭_수`,\r\n    countDistinct(`사용자_ID`) AS `클릭_사용자_수`,\r\n    countDistinct(`세션_ID`) AS `클릭_세션_수`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `이벤트_유형` = '`상품클릭`'\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n  GROUP BY `이벤트_명`\r\n),\r\n\r\n`정렬된_products` AS (\r\n  SELECT\r\n    *\r\n  FROM `상품_클릭_요약`\r\n  ORDER BY `상품_클릭_수` DESC\r\n)\r\n\r\nSELECT\r\n  rowNumberInAllBlocks() + 1 AS `순번`,\r\n  `상품_명` AS `상품/업체명`,\r\n  `상품_클릭_수` AS `상품 클릭 수`,\r\n  `클릭_사용자_수` AS `클릭 유저 수`,\r\n  `클릭_세션_수` AS `클릭 세션 수`,\r\n  round(\r\n    `상품_클릭_수` / nullIf(`클릭_사용자_수`, 0),\r\n    2\r\n  ) AS `유저당 클릭 수`\r\nFROM `정렬된_products`;",
    "panelSpec": {
      "kind": "Panel",
      "id": 21,
      "title": "4-5. 상품·업체 클릭(Product & Vendor Clicks)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 64,
        "w": 24,
        "h": 13,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": []
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-6": {
    "title": "4-6. 검색 결과 품질 지표 (Search Result Quality Metrics)",
    "query": "WITH\r\n`검색_이벤트` AS (\r\n  SELECT\r\n    cityHash64(\r\n      `세션_ID`,\r\n      toString(`클라이언트_시각`),\r\n      `사용자_ID`,\r\n      JSONExtractString(`속성_JSON`, '`검색_카테고리`'),\r\n      JSONExtractString(`속성_JSON`, '`검색_검색어`')\r\n    ) AS `검색_키`,\r\n\r\n    `클라이언트_시각` AS `검색_시각`,\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n\r\n    JSONExtractString(`속성_JSON`, '`검색_카테고리`') AS `검색_카테고리`,\r\n    JSONExtractString(`속성_JSON`, '`검색_검색어`') AS `검색_검색어`,\r\n\r\n    greatest(\r\n      JSONExtractUInt(`속성_JSON`, '`검색_결과_수`'),\r\n      숫자변환함수(JSONExtractString(`속성_JSON`, '`검색_결과_수`'))\r\n    ) AS `검색_결과_수`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `이벤트_유형` = '`검색`'\r\n    AND `세션_ID` != ''\r\n    AND JSONExtractString(`속성_JSON`, '`검색_검색어`') != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`클릭_이벤트` AS (\r\n  SELECT\r\n    `클라이언트_시각` AS `클릭_시각`,\r\n    `세션_ID`\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      `이벤트_유형` IN ('`검색결과클릭`', '`상품클릭`')\r\n      OR JSONExtractString(`속성_JSON`, '`검색_결과_상품_ID`') != ''\r\n    )\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`검색_with_clicks` AS (\r\n  SELECT\r\n    `검색`.`검색_키`,\r\n    `검색`.`검색_카테고리`,\r\n    `검색`.`검색_검색어`,\r\n    `검색`.`사용자_ID`,\r\n    `검색`.`세션_ID`,\r\n    `검색`.`검색_결과_수`,\r\n\r\n    countIf(`클릭`.`클릭_시각` >= `검색`.`검색_시각`) AS `상품_클릭_수`,\r\n\r\n    if(countIf(`클릭`.`클릭_시각` >= `검색`.`검색_시각`) > 0, 1, 0) AS `has_상품_클릭`\r\n\r\n  FROM `검색_이벤트` `검색`\r\n  LEFT JOIN `클릭_이벤트` `클릭`\r\n    ON `검색`.`세션_ID` = `클릭`.`세션_ID`\r\n\r\n  GROUP BY\r\n    `검색`.`검색_키`,\r\n    `검색`.`검색_카테고리`,\r\n    `검색`.`검색_검색어`,\r\n    `검색`.`사용자_ID`,\r\n    `검색`.`세션_ID`,\r\n    `검색`.`검색_결과_수`\r\n)\r\n\r\nSELECT\r\n  if(`검색_카테고리` = '', '카테고리 미확인', `검색_카테고리`) AS `검색 카테고리`,\r\n\r\n  count() AS `검색 수`,\r\n  countDistinct(`사용자_ID`) AS `검색 유저 수`,\r\n  countDistinct(`세션_ID`) AS `검색 세션 수`,\r\n\r\n  round(avg(`검색_결과_수`), 2) AS `평균 검색 결과 수`,\r\n\r\n  countIf(`검색_결과_수` = 0) AS `무결과 수`,\r\n  round(countIf(`검색_결과_수` = 0) / nullIf(count(), 0) * 100, 2) AS `무결과율(%)`,\r\n\r\n  sum(`has_상품_클릭`) AS `상품 클릭 발생 검색 수`,\r\n  round(sum(`has_상품_클릭`) / nullIf(count(), 0) * 100, 2) AS `검색 후 상품 클릭률(%)`,\r\n\r\n  sum(`상품_클릭_수`) AS `상품 클릭 수`,\r\n  round(sum(`상품_클릭_수`) / nullIf(count(), 0), 2) AS `검색당 평균 상품 클릭 수`\r\n\r\nFROM `검색_with_clicks`\r\nGROUP BY `검색_카테고리`\r\nORDER BY\r\n  `검색 수` DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 22,
      "title": "4-6. 검색 결과 품질 지표 (Search Result Quality Metrics)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 77,
        "w": 24,
        "h": 15,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "평균 검색 결과 수",
        "무결과율(%)",
        "검색 후 상품 클릭률(%)",
        "검색당 평균 상품 클릭 수"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "blue"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "red"
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 검색 결과 수"
            },
            "properties": [
              {
                "id": "decimals",
                "value": 2
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "무결과율(%)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "검색 후 상품 클릭률(%)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "red",
                      "value": null
                    },
                    {
                      "color": "yellow",
                      "value": 40
                    },
                    {
                      "color": "green",
                      "value": 60
                    },
                    {
                      "color": "blue",
                      "value": 80
                    }
                  ]
                }
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "검색당 평균 상품 클릭 수"
            },
            "properties": [
              {
                "id": "decimals",
                "value": 2
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-7": {
    "title": "4-7. 검색어별 상품 클릭 전환 (Search-to-Product Click Conversion by Keyword)",
    "query": "WITH\r\n`검색_이벤트` AS (\r\n  SELECT\r\n    cityHash64(\r\n      `세션_ID`,\r\n      toString(`클라이언트_시각`),\r\n      `사용자_ID`,\r\n      JSONExtractString(`속성_JSON`, '`검색_카테고리`'),\r\n      JSONExtractString(`속성_JSON`, '`검색_검색어`')\r\n    ) AS `검색_키`,\r\n\r\n    `클라이언트_시각` AS `검색_시각`,\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n\r\n    JSONExtractString(`속성_JSON`, '`검색_카테고리`') AS `검색_카테고리`,\r\n    JSONExtractString(`속성_JSON`, '`검색_검색어`') AS `검색_검색어`,\r\n\r\n    greatest(\r\n      JSONExtractUInt(`속성_JSON`, '`검색_결과_수`'),\r\n      숫자변환함수(JSONExtractString(`속성_JSON`, '`검색_결과_수`'))\r\n    ) AS `검색_결과_수`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `이벤트_유형` = '`검색`'\r\n    AND `세션_ID` != ''\r\n    AND JSONExtractString(`속성_JSON`, '`검색_검색어`') != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`클릭_이벤트` AS (\r\n  SELECT\r\n    `클라이언트_시각` AS `클릭_시각`,\r\n    `세션_ID`,\r\n\r\n    multiIf(\r\n      JSONExtractString(`속성_JSON`, '`검색_결과_상품_명`') != '',\r\n        JSONExtractString(`속성_JSON`, '`검색_결과_상품_명`'),\r\n\r\n      JSONExtractString(`속성_JSON`, '`상품_명`') != '',\r\n        JSONExtractString(`속성_JSON`, '`상품_명`'),\r\n\r\n      JSONExtractString(`속성_JSON`, '`업체_명`') != '',\r\n        JSONExtractString(`속성_JSON`, '`업체_명`'),\r\n\r\n      `이벤트_명` != '',\r\n        `이벤트_명`,\r\n\r\n      '상품명 미확인'\r\n    ) AS `클릭된_상품_명`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND (\r\n      `이벤트_유형` IN ('`검색결과클릭`', '`상품클릭`')\r\n      OR JSONExtractString(`속성_JSON`, '`검색_결과_상품_ID`') != ''\r\n    )\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`검색_with_clicks` AS (\r\n  SELECT\r\n    `검색`.`검색_키`,\r\n    `검색`.`검색_카테고리`,\r\n    `검색`.`검색_검색어`,\r\n    `검색`.`사용자_ID`,\r\n    `검색`.`세션_ID`,\r\n    `검색`.`검색_결과_수`,\r\n\r\n    countIf(`클릭`.`클릭_시각` >= `검색`.`검색_시각`) AS `상품_클릭_수`,\r\n\r\n    if(countIf(`클릭`.`클릭_시각` >= `검색`.`검색_시각`) > 0, 1, 0) AS `has_상품_클릭`,\r\n\r\n    anyIf(\r\n      `클릭`.`클릭된_상품_명`,\r\n      `클릭`.`클릭_시각` >= `검색`.`검색_시각`\r\n        AND `클릭`.`클릭된_상품_명` != ''\r\n        AND `클릭`.`클릭된_상품_명` != '상품명 미확인'\r\n    ) AS `representative_상품`\r\n\r\n  FROM `검색_이벤트` `검색`\r\n  LEFT JOIN `클릭_이벤트` `클릭`\r\n    ON `검색`.`세션_ID` = `클릭`.`세션_ID`\r\n\r\n  GROUP BY\r\n    `검색`.`검색_키`,\r\n    `검색`.`검색_카테고리`,\r\n    `검색`.`검색_검색어`,\r\n    `검색`.`사용자_ID`,\r\n    `검색`.`세션_ID`,\r\n    `검색`.`검색_결과_수`\r\n),\r\n\r\n`검색어_요약` AS (\r\n  SELECT\r\n    `검색_카테고리`,\r\n    `검색_검색어`,\r\n\r\n    count() AS `검색_수`,\r\n    countDistinct(`사용자_ID`) AS `사용자_수`,\r\n    countDistinct(`세션_ID`) AS `세션_수`,\r\n\r\n    sum(`has_상품_클릭`) AS `클릭된_검색_수`,\r\n    sum(`상품_클릭_수`) AS `상품_클릭_수`,\r\n\r\n    countIf(`검색_결과_수` = 0) AS `zero_결과_수`,\r\n    round(countIf(`검색_결과_수` = 0) / nullIf(count(), 0) * 100, 2) AS `zero_결과_비율`,\r\n\r\n    round(avg(`검색_결과_수`), 2) AS `평균_검색_결과_수`,\r\n\r\n    상위값함수(1)(\r\n      `representative_상품`,\r\n      `representative_상품` != ''\r\n    ) AS `top_클릭된_products`\r\n\r\n  FROM `검색_with_clicks`\r\n  GROUP BY\r\n    `검색_카테고리`,\r\n    `검색_검색어`\r\n)\r\n\r\nSELECT\r\n  if(`검색_카테고리` = '', '카테고리 미확인', `검색_카테고리`) AS `검색 카테고리`,\r\n  `검색_검색어` AS `검색어`,\r\n\r\n  `검색_수` AS `검색 수`,\r\n  `사용자_수` AS `검색 유저 수`,\r\n  `세션_수` AS `검색 세션 수`,\r\n\r\n  `클릭된_검색_수` AS `상품 클릭 발생 검색 수`,\r\n  round(`클릭된_검색_수` / nullIf(`검색_수`, 0) * 100, 2) AS `검색 후 상품 클릭률(%)`,\r\n\r\n  `상품_클릭_수` AS `상품 클릭 수`,\r\n  round(`상품_클릭_수` / nullIf(`검색_수`, 0), 2) AS `검색당 평균 상품 클릭 수`,\r\n\r\n  if(\r\n    길이함수(`top_클릭된_products`) = 0,\r\n    '-',\r\n    arrayElement(`top_클릭된_products`, 1)\r\n  ) AS `대표 클릭 상품`,\r\n\r\n  `zero_결과_수` AS `무결과 수`,\r\n  `zero_결과_비율` AS `무결과율(%)`,\r\n  `평균_검색_결과_수` AS `평균 검색 결과 수`\r\n\r\nFROM `검색어_요약`\r\nORDER BY\r\n  `검색 수` DESC,\r\n  `검색 후 상품 클릭률(%)` DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 24,
      "title": "4-7. 검색어별 상품 클릭 전환 (Search-to-Product Click Conversion by Keyword)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 92,
        "w": 24,
        "h": 17,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "검색 후 상품 클릭률(%)",
        "검색당 평균 상품 클릭 수",
        "무결과율(%)",
        "평균 검색 결과 수"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "blue"
              },
              {
                "value": 25,
                "color": "orange"
              },
              {
                "value": 50,
                "color": "red"
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "검색 후 상품 클릭률(%)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "red",
                      "value": null
                    },
                    {
                      "color": "yellow",
                      "value": 40
                    },
                    {
                      "color": "green",
                      "value": 60
                    },
                    {
                      "color": "blue",
                      "value": 80
                    }
                  ]
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "검색당 평균 상품 클릭 수"
            },
            "properties": [
              {
                "id": "decimals",
                "value": 2
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "무결과율(%)"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "decimals",
                "value": 2
              },
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "color-background"
                }
              }
            ]
          },
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "평균 검색 결과 수"
            },
            "properties": [
              {
                "id": "decimals",
                "value": 2
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "4-8": {
    "title": "4-8. 스크랩 상태 요약 (Scrap Status Summary)",
    "query": "WITH\r\n`스크랩_이벤트` AS (\r\n  SELECT\r\n    multiIf(\r\n      JSONExtractBool(`속성_JSON`, '`상태`') = 1, '스크랩 추가',\r\n      JSONExtractBool(`속성_JSON`, '`상태`') = 0, '스크랩 해제',\r\n      '상태 미확인'\r\n    ) AS `스크랩_상태`,\r\n\r\n    `사용자_ID`,\r\n    `세션_ID`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $__timeFilter(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND `이벤트_유형` = '`일반클릭`'\r\n    AND `이벤트_명` = '콘텐츠 스크랩'\r\n    AND JSONHas(`속성_JSON`, '`상태`')\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`요약` AS (\r\n  SELECT\r\n    `스크랩_상태`,\r\n    count() AS `스크랩_클릭_수`,\r\n    countDistinct(`사용자_ID`) AS `스크랩_사용자_수`,\r\n    countDistinct(`세션_ID`) AS `스크랩_세션_수`\r\n  FROM `스크랩_이벤트`\r\n  GROUP BY `스크랩_상태`\r\n),\r\n\r\n`전체` AS (\r\n  SELECT\r\n    sum(`스크랩_클릭_수`) AS `전체_스크랩_클릭_수`\r\n  FROM `요약`\r\n)\r\n\r\nSELECT\r\n  `스크랩_상태` AS `스크랩 상태`,\r\n  `스크랩_클릭_수` AS `클릭 수`,\r\n  round(`스크랩_클릭_수` / nullIf(`전체_스크랩_클릭_수`, 0) * 100, 2) AS `비율(%)`,\r\n  `스크랩_사용자_수` AS `유저 수`,\r\n  `스크랩_세션_수` AS `세션 수`\r\nFROM `요약`\r\nCROSS JOIN `전체`\r\nORDER BY\r\n  `클릭 수` DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 23,
      "title": "4-8. 스크랩 상태 요약 (Scrap Status Summary)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 109,
        "w": 24,
        "h": 11,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "bargauge",
      "queryCount": 1,
      "columns": [
        ".*비율.*"
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          },
          "color": {
            "mode": "palette-classic"
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byRegexp",
              "scope": "series",
              "options": ".*비율.*"
            },
            "properties": [
              {
                "id": "unit",
                "value": "`비율`"
              },
              {
                "id": "min",
                "value": 0
              },
              {
                "id": "max",
                "value": 100
              },
              {
                "id": "decimals",
                "value": 2
              }
            ]
          }
        ]
      },
      "options": {
        "reduceOptions": {
          "values": true,
          "calcs": [],
          "fields": ""
        },
        "orientation": "horizontal",
        "legend": {
          "showLegend": true,
          "displayMode": "list",
          "placement": "bottom",
          "calcs": []
        },
        "displayMode": "lcd",
        "valueMode": "color",
        "namePlacement": "auto",
        "showUnfilled": true,
        "sizing": "auto",
        "minVizWidth": 8,
        "minVizHeight": 16,
        "maxVizHeight": 300
      },
      "transformations": []
    }
  },
  "4-9": {
    "title": "4-9. 최종 스크랩 상태별 발생 화면 목록 (Latest Scrap Status by Source Page)",
    "query": "WITH\r\n`스크랩_이벤트` AS (\r\n  SELECT\r\n    `클라이언트_시각`,\r\n\r\n    `사용자_ID`,\r\n    `세션_ID`,\r\n    `페이지_제목`,\r\n    `페이지_URL`,\r\n\r\n    JSONExtractBool(`속성_JSON`, '`상태`') AS `스크랩_상태_불리언`,\r\n\r\n    multiIf(\r\n      `페이지_URL` LIKE '%/서비스영역/`상세`/%', '상품 상세 화면',\r\n      `페이지_URL` LIKE '%/서비스영역/메인/%', '스토어 메인/카테고리 화면',\r\n      `페이지_URL` LIKE '%/서비스영역/카테고리대표/%', '스토어 카테고리 Best 화면',\r\n      `페이지_URL` LIKE '%/커뮤니티/%', '커뮤니티 콘텐츠 화면',\r\n      `페이지_URL` LIKE '%/소식/포스트/%', '요즘소식/포스트 화면',\r\n      `페이지_URL` LIKE '%/`검색`%', '검색 결과/검색 화면',\r\n      '기타 화면'\r\n    ) AS `스크랩_발생화면_페이지_유형`,\r\n\r\n    추출함수(`페이지_URL`, '([^/?#]+)(?:[?#].*)?$') AS `발생화면_페이지_ID`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $__timeFilter(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND `사용자_ID` != ''\r\n    AND `이벤트_유형` = '`일반클릭`'\r\n    AND `이벤트_명` = '콘텐츠 스크랩'\r\n    AND `속성_JSON` != ''\r\n    AND JSONHas(`속성_JSON`, '`상태`')\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`최신_by_사용자_페이지` AS (\r\n  SELECT\r\n    `사용자_ID`,\r\n    `스크랩_발생화면_페이지_유형`,\r\n    `발생화면_페이지_ID`,\r\n    argMax(`페이지_제목`, `클라이언트_시각`) AS `페이지_제목`,\r\n    argMax(`페이지_URL`, `클라이언트_시각`) AS `페이지_URL`,\r\n    argMax(`스크랩_상태_불리언`, `클라이언트_시각`) AS `최신_상태`,\r\n    max(`클라이언트_시각`) AS `최신_이벤트_시각`\r\n  FROM `스크랩_이벤트`\r\n  GROUP BY\r\n    `사용자_ID`,\r\n    `스크랩_발생화면_페이지_유형`,\r\n    `발생화면_페이지_ID`\r\n)\r\n\r\nSELECT\r\n  multiIf(\r\n    `최신_상태` = 1, '현재 스크랩 유지',\r\n    `최신_상태` = 0, '최종 해제',\r\n    '상태 미확인'\r\n  ) AS `최종 스크랩 상태`,\r\n\r\n  `스크랩_발생화면_페이지_유형` AS `스크랩 발생 화면`,\r\n  `페이지_제목` AS `발생 페이지명`,\r\n  `발생화면_페이지_ID` AS `페이지/대상 ID`,\r\n  `페이지_URL` AS `발생 페이지 URL`,\r\n\r\n  countDistinct(`사용자_ID`) AS `유저 수`,\r\n  max(`최신_이벤트_시각`) AS `최근 변경 시각`\r\n\r\nFROM `최신_by_사용자_페이지`\r\nGROUP BY\r\n  `최신_상태`,\r\n  `스크랩_발생화면_페이지_유형`,\r\n  `페이지_제목`,\r\n  `발생화면_페이지_ID`,\r\n  `페이지_URL`\r\nORDER BY\r\n  `유저 수` DESC,\r\n  `최근 변경 시각` DESC\r\nLIMIT 1000;",
    "panelSpec": {
      "kind": "Panel",
      "id": 25,
      "title": "4-9. 최종 스크랩 상태별 발생 화면 목록 (Latest Scrap Status by Source Page)",
      "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
      "gridPos": {
        "x": 0,
        "y": 120,
        "w": 24,
        "h": 14,
        "row": "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)"
      },
      "visualization": "table",
      "queryCount": 1,
      "columns": [
        "발생 페이지 URL"
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "footer": {
              "reducers": []
            },
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "scope": "series",
              "options": "발생 페이지 URL"
            },
            "properties": [
              {
                "id": "custom.cellOptions",
                "value": {
                  "type": "data-links"
                }
              },
              {
                "id": "links",
                "value": [
                  {
                    "targetBlank": true,
                    "title": "${__data.fields[\"발생 페이지 URL\"]}",
                    "url": "${__data.fields[\"발생 페이지 URL\"]}"
                  }
                ]
              }
            ]
          }
        ]
      },
      "options": {
        "showHeader": true,
        "cellHeight": "sm"
      },
      "transformations": []
    }
  },
  "5-1": {
    "title": "5-1. 플랫폼·기기 환경별 세션 분포 (Platform & Device Environment)",
    "query": "WITH\r\n`기준데이터` AS (\r\n  SELECT\r\n    multiIf(\r\n      lower(`플랫폼`) = '`IOS`' AND lower(`기기_유형`) = '`모바일`', 'IOS 모바일',\r\n      lower(`플랫폼`) = '`IOS`' AND lower(`기기_유형`) = '`태블릿`', 'IOS 태블릿',\r\n      lower(`플랫폼`) = '`IOS`' AND lower(`기기_유형`) = '', 'IOS',\r\n\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`') AND lower(`기기_유형`) = '`모바일`', 'AOS 모바일',\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`') AND lower(`기기_유형`) = '`태블릿`', 'AOS 태블릿',\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`') AND lower(`기기_유형`) = '`데스크톱`', 'AOS 데스크톱',\r\n      lower(`플랫폼`) IN ('`AOS`', '`안드로이드`') AND lower(`기기_유형`) = '', 'AOS',\r\n\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`') AND lower(`기기_유형`) = '`데스크톱`', '웹 데스크톱',\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`') AND lower(`기기_유형`) = '`모바일`', '웹 모바일',\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`') AND lower(`기기_유형`) = '`태블릿`', '웹 태블릿',\r\n      lower(`플랫폼`) IN ('`웹`', '`PC`', '`모바일_웹`', '`모바일웹`') AND lower(`기기_유형`) = '', '웹',\r\n\r\n      concat(ifNull(`플랫폼`, ''), ' ', ifNull(`기기_유형`, ''))\r\n    ) AS `기기_그룹`,\r\n\r\n    ifNull(`OS_유형`, '-') AS `OS_명`,\r\n    ifNull(`브라우저`, '-') AS `브라우저_명`,\r\n    ifNull(`앱_버전`, '-') AS `앱_버전_명`,\r\n\r\n    `세션_ID`\r\n\r\n  FROM 행동 이벤트 테이블\r\n  WHERE $`timeFilter_밀리초`(`클라이언트_시각`)\r\n    AND `세션_ID` != ''\r\n    AND `플랫폼` != ''\r\n    AND (\r\n      '${`검색_사용자ID`}' = ''\r\n      OR '${`검색_사용자ID`}' = 'All'\r\n      OR `사용자_ID` = '${`검색_사용자ID`}'\r\n    )\r\n),\r\n\r\n`환경_요약` AS (\r\n  SELECT\r\n    concat(\r\n      `기기_그룹`,\r\n      multiIf(`OS_명` != '-', concat(' / ', `OS_명`), ''),\r\n      multiIf(`브라우저_명` != '-', concat(' / ', `브라우저_명`), ''),\r\n      multiIf(`앱_버전_명` != '-', concat(' / 앱 ', `앱_버전_명`), '')\r\n    ) AS `환경_명`,\r\n\r\n    countDistinct(`세션_ID`) AS `세션_수`\r\n\r\n  FROM `기준데이터`\r\n  GROUP BY\r\n    `기기_그룹`,\r\n    `OS_명`,\r\n    `브라우저_명`,\r\n    `앱_버전_명`\r\n),\r\n\r\n`전체` AS (\r\n  SELECT\r\n    sum(`세션_수`) AS `전체_세션수`\r\n  FROM `환경_요약`\r\n)\r\n\r\nSELECT\r\n  `환경_명` AS `환경 구분`,\r\n  `세션_수` AS `세션 수`,\r\n  round(`세션_수` / nullIf(`전체_세션수`, 0) * 100, 2) AS `세션 비중(%)`\r\nFROM `환경_요약`\r\nCROSS JOIN `전체`\r\nORDER BY\r\n  `세션 수` DESC;",
    "panelSpec": {
      "kind": "Panel",
      "id": 10,
      "title": "5-1. 플랫폼·기기 환경별 세션 분포 (Platform & Device Environment)",
      "row": "Row 5. UX 및 환경 데이터 (UX & Environment Metrics)",
      "gridPos": {
        "x": 0,
        "y": 0,
        "w": 24,
        "h": 17,
        "row": "Row 5. UX 및 환경 데이터 (UX & Environment Metrics)"
      },
      "visualization": "barchart",
      "queryCount": 1,
      "columns": [],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "lineWidth": 1,
            "fillOpacity": 70,
            "gradientMode": "none",
            "axisPlacement": "auto",
            "axisLabel": "",
            "axisColorMode": "text",
            "axisBorderShow": false,
            "scaleDistribution": {
              "type": "linear"
            },
            "axisCenteredZero": false,
            "hideFrom": {
              "tooltip": false,
              "viz": false,
              "legend": false
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "color": {
            "mode": "palette-classic-by-`명`"
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "value": null,
                "color": "green"
              },
              {
                "value": 80,
                "color": "red"
              }
            ]
          }
        },
        "overrides": []
      },
      "options": {
        "orientation": "horizontal",
        "xTickLabelRotation": 0,
        "xTickLabelSpacing": 0,
        "showValue": "auto",
        "stacking": "normal",
        "groupWidth": 0.7,
        "barWidth": 0.56,
        "barRadius": 0.05,
        "fullHighlight": false,
        "tooltip": {
          "mode": "multi",
          "sort": "desc",
          "hideZeros": false
        },
        "legend": {
          "showLegend": false,
          "displayMode": "`테이블`",
          "placement": "bottom",
          "calcs": []
        }
      },
      "transformations": []
    }
  }
};
