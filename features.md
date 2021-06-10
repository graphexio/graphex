| Module    	| Group   	| Feature              	| Subfeature  	| Sub-subfeature 	| Type                     	|   	| MongoDB 	| Sequelize 	|
|-----------	|---------	|----------------------	|-------------	|----------------	|--------------------------	|---	|:-------:	|:---------:	|
| Model     	| Create  	| Create One Mutation  	| -           	| -              	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Abstract interface       	|   	|    ✅    	|     ✅     	|
|           	| Read    	| Read One Query       	| -           	| -              	| Read One Query           	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	| Read Many Query      	| -           	| -              	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Filter      	| -              	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Limit       	| -              	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Offset      	| -              	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Order       	| -              	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	| Connection Query     	| -           	| -              	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Nodes       	| Filter         	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	| Limit          	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	| Offset         	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	| Order          	| -                        	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	| Total count 	| Filter         	| -                        	|   	|    ✅    	|     ✅     	|
|           	| Update  	| Update One Mutation  	| -           	|                	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	| Delete  	| Delete One Mutation  	| -           	|                	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	|         	| Delete Many Mutation 	| -           	|                	| Simple model             	|   	|    ✅    	|     ✅     	|
|           	|         	|                      	|             	|                	| Interface model          	|   	|    ✅    	|     ✅     	|
|           	| Filters 	| As Is                	| -           	| -              	| Scalar type              	|   	|    ✅    	|     ✅     	|
|           	|         	| All                  	| -           	| -              	| Array of Scalar types    	|   	|    ✅    	|     ❌     	|
|           	|         	| Contains             	| -           	| -              	| String                   	|   	|    ✅    	|     ✅     	|
|           	|         	| Ends With            	| -           	| -              	| String                   	|   	|    ✅    	|     ✅     	|
|           	|         	| Exact                	| -           	| -              	| Array of Scalar types    	|   	|    ✅    	|     ❌     	|
|           	|         	| Exists               	| -           	| -              	| -                        	|   	|    ✅    	|     ❌     	|
|           	|         	| Greater              	| -           	| -              	| Int, Float, String, Date 	|   	|    ✅    	|     ✅     	|
|           	|         	| Greater or equal     	| -           	| -              	| Int, Float, String, Date 	|   	| ✅       	| ✅         	|
|           	|         	|                      	|             	|                	| Float                    	|   	| ✅       	| ✅         	|
|           	|         	| In                   	| -           	| -              	| Scalar type              	|   	| ✅       	| ❌         	|
|           	|         	| Lower                	| -           	| -              	| Int, Float, String, Date 	|   	| ✅       	| ✅         	|
|           	|         	| Lower or equal       	| -           	| -              	| Int, Float, String, Date 	|   	| ✅       	| ✅         	|
|           	|         	| Not In               	| -           	| -              	| Scalar type              	|   	| ✅       	| ✅         	|
|           	|         	| Not Size             	| -           	| -              	| Array                    	|   	| ✅       	| ❌         	|
|           	|         	| Not                  	| -           	| -              	| Scalar type              	|   	| ✅       	| ❌         	|
|           	|         	| Size                 	| -           	| -              	| Array                    	|   	| ✅       	| ❌         	|
|           	|         	| Some                 	| -           	| -              	| Array of Scalar types    	|   	| ✅       	| ❌         	|
|           	|         	| Starts With          	| -           	| -              	| String                   	|   	| ✅       	| ✅         	|
