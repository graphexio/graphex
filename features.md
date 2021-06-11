| Module             	| Submodule        	| Group   	| Feature              	| Subfeature                   	| Sub-subfeature 	| Type                         	|   	| MongoDB 	| Sequelize 	|
|--------------------	|------------------	|---------	|----------------------	|------------------------------	|----------------	|------------------------------	|---	|:-------:	|:---------:	|
| Model              	| -                	| Create  	| Create One Mutation  	| -                            	| -              	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Abstract interface           	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Read    	| Read One Query       	| -                            	| -              	| Read One Query               	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Many Query      	| -                            	| -              	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Limit                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Offset                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Order                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Connection Query     	| -                            	| -              	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Nodes                        	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Limit          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Offset         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Order          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Total count                  	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Update  	| Update One Mutation  	| -                            	|                	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Delete  	| Delete One Mutation  	| -                            	|                	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Delete Many Mutation 	| -                            	|                	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Filters 	| As Is                	| -                            	| -              	| Scalar type                  	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| All                  	| -                            	| -              	| Array of Scalar types        	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Contains             	| -                            	| -              	| String                       	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Ends With            	| -                            	| -              	| String                       	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Exact                	| -                            	| -              	| Array of Scalar types        	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Exists               	| -                            	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Greater              	| -                            	| -              	| Int, Float, String, Date     	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Greater or equal     	| -                            	| -              	| Int, Float, String, Date     	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Float                        	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| In                   	| -                            	| -              	| Scalar type                  	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Lower                	| -                            	| -              	| Int, Float, String, Date     	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Lower or equal       	| -                            	| -              	| Int, Float, String, Date     	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Not In               	| -                            	| -              	| Scalar type                  	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Not Size             	| -                            	| -              	| Array                        	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Not                  	| -                            	| -              	| Scalar type                  	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Size                 	| -                            	| -              	| Array                        	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Some                 	| -                            	| -              	| Array of Scalar types        	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Starts With          	| -                            	| -              	| String                       	|   	|    ✅    	|     ✅     	|
| Relations          	| Link To          	| Read    	| Read One             	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Many            	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Limit                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Offset                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Order                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Connection      	| Nodes                        	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Limit          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Offset         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Order          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Total count                  	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Create  	| Create One           	| Create                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Create Many          	| Create                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Update  	| Update One           	| Create                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Update Many          	| Create                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Recreate                     	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Connect Once                 	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Reconnect                    	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Disconnect                   	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Delete                       	| -              	| -                            	|   	|    ❌    	|     ❌     	|
|                    	|                  	| Filters 	| As Is                	| -                            	| -              	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Abstract interface           	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Some                 	| -                            	| -              	| Array of Simple models       	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Interface models    	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Abstract interfaces 	|   	|    ✅    	|     ❌     	|
|                    	| Link From        	| Read    	| Read One             	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Many            	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Limit                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Offset                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Order                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Connection      	| Nodes                        	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Limit          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Offset         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	| Order          	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Total count                  	| Filter         	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Filters 	| As Is                	| -                            	| -              	| Simple model                 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Interface model              	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Abstract interface           	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Some                 	| Link To One in target model  	| -              	| Array of Simple models       	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Interface models    	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Abstract interfaces 	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Link To Many in target model 	| -              	| Array of Simple models       	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Interface models    	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	|                              	|                	| Array of Abstract interfaces 	|   	|    ✅    	|     ❌     	|
| Subdocuments       	| -                	| Read    	| Read One             	| -                            	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Read Many            	| Filter                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Limit                        	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Offset                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Order                        	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	| Create  	| Create One           	| Create                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Create Many          	| Create                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	| Update  	| Update One           	| Create                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Update                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Update Many          	| Create                       	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Recreate                     	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Update Many                  	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	|                      	| Delete Many                  	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	| Filters 	| As Is                	| -                            	| -              	| Single document              	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| All                  	| -                            	| -              	| Array of documents           	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Exact                	| -                            	| -              	| Array of documents           	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Exists               	| -                            	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| In                   	| -                            	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Not In               	| -                            	| -              	| -                            	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Not Size             	| -                            	| -              	| Array of documents           	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Size                 	| -                            	| -              	| Array of documents           	|   	|    ✅    	|     ❌     	|
|                    	|                  	|         	| Some                 	| -                            	| -              	| Array of documents           	|   	|    ✅    	|     ❌     	|
| Federation         	| -                	| -       	| -                    	| -                            	| -              	| -                            	|   	|    ✅    	|     ✅     	|
| External Relations 	| External Link To 	| Read    	| Read One             	| -                            	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Read Many            	| Limit                        	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Offset                       	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Create  	| Create One           	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Create Many          	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Update  	| Update One           	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Update Many          	| Connect                      	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Reconnect                    	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	|                      	| Disconnect                   	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	| Filters 	| As Is                	| -                            	| -              	| -                            	|   	|    ✅    	|     ✅     	|
|                    	|                  	|         	| Some                 	| -                            	| -              	| -                            	|   	|    ✅    	|     ✅     	|
