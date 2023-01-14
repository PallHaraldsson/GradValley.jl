var documenterSearchIndex = {"docs":
[{"location":"tutorials_and_examples/#Tutorials-and-Examples","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"Here, you can find detailed explanations on how to build and train specific models with GradValley.jl.","category":"page"},{"location":"tutorials_and_examples/#A-LeNet-like-model-for-handwritten-digit-recognition","page":"Tutorials and Examples","title":"A LeNet-like model for handwritten digit recognition","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"In this tutorial, we will learn the basics of GradValley.jl while building a model for handwritten digit recognition, reaching approximately 99% accuracy on the MNIST-dataset. The whole code at once can be found here.","category":"page"},{"location":"tutorials_and_examples/#Importing-modules","page":"Tutorials and Examples","title":"Importing modules","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"using GradValley # the master module of GradValley.jl\r\nusing GradValley.Layers # The \"Layers\" module provides all the building blocks for creating a model. \r\nusing GradValley.Optimization # The \"Optimization\" module provides different loss functions and optimizers.","category":"page"},{"location":"tutorials_and_examples/#Using-the-dataset","page":"Tutorials and Examples","title":"Using the dataset","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"We will use the MLDatasets package which downloads the MNIST-dataset for us automatically. If you haven't installed MLDatasets yet, write this for installation:","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"import Pkg; Pkg.add(\"MLDatasets\")","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"Then we can import MLDatasets:","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"using MLDatasets # # a package for downloading datasets","category":"page"},{"location":"tutorials_and_examples/#Splitting-up-the-dataset-into-a-train-and-a-test-partition","page":"Tutorials and Examples","title":"Splitting up the dataset into a train and a test partition","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"The MNIST-dataset contains 70,000 images, we will use 60,000 images for training the network and 10,000 images for evaluating accuracy.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# initialize train- and test-dataset\r\nmnist_train = MNIST(:train) \r\nmnist_test = MNIST(:test)","category":"page"},{"location":"tutorials_and_examples/#Using-GradValley.DataLoader-for-handling-data","page":"Tutorials and Examples","title":"Using GradValley.DataLoader for handling data","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"A typical workflow when dealing with datasets is to use the GradValley.DataLoader struct. A data loader makes it easy to iterate directly over the batches in a dataset.  Due to better memory efficiency, the data loader loads the batches just in time. When initializing a data loader, we specify a function that returns exactly one element from the dataset at a given index. We also have to specify the size of the dataset (e.g. the number of images). All parameters that the data loader accepts (see Reference for more information):","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"DataLoader(get_function::Function, dataset_size::Integer; batch_size::Integer=1, shuffle::Bool=false, drop_last::Bool=false)","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"Now we write the get function for the two data loaders.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# function for getting an image and the corresponding target vector from the train or test partition\r\nfunction get_element(index, partition)\r\n    # load one image and the corresponding label\r\n    if partition == \"train\"\r\n        image, label = mnist_train[index]\r\n    else # test partition\r\n        image, label = mnist_test[index]\r\n    end\r\n    # add channel dimension and rescaling the values to their original 8 bit gray scale values\r\n    image = reshape(image, 1, 28, 28) .* 255\r\n    # generate the target vector from the label, one for the correct digit, zeros for the wrong digits\r\n    targets = zeros(10)\r\n    targets[label + 1] = 1.00\r\n\r\n    return convert(Array{Float64, 3}, image), targets\r\nend","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"We can now initialize the data loaders.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# initialize the data loaders\r\ntrain_data_loader = DataLoader(index -> get_element(index, \"train\"), length(mnist_train), batch_size=32, shuffle=true)\r\ntest_data_loader = DataLoader(index -> get_element(index, \"test\"), length(mnist_test), batch_size=32)","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"If you want to force the data loader to load the data all at once, you could do:","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# force the data loaders to load all the data at once into memory, depending on the dataset's size, this may take a while\r\ntrain_data = train_data_loader[begin:end]\r\ntest_data = test_data_loader[begin:end]","category":"page"},{"location":"tutorials_and_examples/#Building-the-neuronal-network-aka.-the-model","page":"Tutorials and Examples","title":"Building the neuronal network aka. the model","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"The most recommend way to build models is to use the GradValley.Layers.SequentialContainer struct. A SequtialContainer can take an array of layers or other SequentialContainers (sub-models). While forward-pass, the given inputs are sequentially propagated through every layer (or sub-model) and the output will be returned. For more details, see Reference. The LeNet5 model is one of the earliest convolutional neuronal networks (CNNs) reaching approximately 99% accuracy on the MNIST-dataset. The LeNet5 is built of two main parts, the feature extractor and the classifier. So it would be a good idea to clarify that in the code:","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# Definition of a LeNet-like model consisting of a feature extractor and a classifier\r\nfeature_extractor = SequentialContainer([ # a convolution layer with 1 in channel, 6 out channels, a 5*5 kernel and a relu activation\r\n                                         Conv(1, 6, (5, 5), activation_function=\"relu\"),\r\n                                         # an average pooling layer with a 2*2 filter (when not specified, stride is automatically set to kernel size)\r\n                                         AvgPool((2, 2)),\r\n                                         Conv(6, 16, (5, 5), activation_function=\"relu\"),\r\n                                         AvgPool((2, 2))])\r\nflatten = Reshape((256, ))\r\nclassifier = SequentialContainer([ # a fully connected layer (also known as dense or linear) with 256 in features, 120 out features and a relu activation\r\n                                  Fc(256, 120, activation_function=\"relu\"),\r\n                                  Fc(120, 84, activation_function=\"relu\"),\r\n                                  Fc(84, 10),\r\n                                  # a softmax activation layer, the softmax will be calculated along the second dimension (the features dimension)\r\n                                  Softmax(dim=2)])\r\n# The final model consists of three different submodules, \r\n# which shows that a SequentialContainer can contain not only layers, but also other SequentialContainers\r\nmodel = SequentialContainer([feature_extractor, flatten, classifier])","category":"page"},{"location":"tutorials_and_examples/#Printing-a-nice-looking-summary-of-the-model","page":"Tutorials and Examples","title":"Printing a nice looking summary of the model","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"Summarizing a model and counting the number of trainable parameters is easily done with the GradValley.Layers.summarie_model function.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# printing a nice looking summary of the model\r\nsummary, num_params = summarize_model(model)\r\nprintln(summary)","category":"page"},{"location":"tutorials_and_examples/#Defining-hyperparameters","page":"Tutorials and Examples","title":"Defining hyperparameters","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"Before we start to train and test the model, we define all necessary hyperparameters. If we want to change the learning rate or the loss function for example, this is the one place to do this.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# defining hyperparameters\r\nloss_function = mse_loss # mean squared error\r\nlearning_rate = 0.05\r\noptimizer = MSGD(model, learning_rate, momentum=0.5) # momentum stochastic gradient descent with a momentum of 0.5\r\nepochs = 5 # 5 or 10","category":"page"},{"location":"tutorials_and_examples/#Train-and-test-the-model","page":"Tutorials and Examples","title":"Train and test the model","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"The next step is to write a function for training the model using the above defined hyperparameters. The network is trained 10 times (epochs) with the entire training data set. After each batch, the weights/parameters of the network are adjusted/optimized. However, we want to test the model after each epoch, so we need to write a function for evaluating the model's accuracy first.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# evaluate the model's accuracy\r\nfunction test()\r\n    num_correct_preds = 0\r\n    avg_test_loss = 0\r\n    for (batch, (images_batch, targets_batch)) in enumerate(test_data_loader)\r\n        # computing predictions\r\n        predictions_batch = forward(model, images_batch)\r\n        # checking for each image in the batch individually if the prediction is correct\r\n        for index_batch in 1:size(predictions_batch)[1]\r\n            single_prediction = predictions_batch[index_batch, :]\r\n            single_target = targets_batch[index_batch, :]\r\n            if argmax(single_prediction) == argmax(single_target)\r\n                num_correct_preds += 1\r\n            end\r\n        end\r\n        # adding the loss for measuring the average test loss\r\n        avg_test_loss += loss_function(predictions_batch, targets_batch, return_derivative=false)\r\n    end\r\n\r\n    accuracy = num_correct_preds / size(test_data_loader) * 100 # size(data_loader) returns the dataset size\r\n    avg_test_loss /= length(test_data_loader) # length(data_loader) returns the number of batches\r\n\r\n    return accuracy, avg_test_loss\r\nend\r\n\r\n# train the model with the above defined hyperparameters\r\nfunction train()\r\n    for epoch in 1:epochs\r\n\r\n        @time begin # for measuring time taken by one epoch\r\n\r\n            avg_train_loss = 0.00\r\n            # iterating over the whole data set\r\n            for (batch, (images_batch, targets_batch)) in enumerate(train_data_loader)\r\n                # computing predictions\r\n                predictions_batch = forward(model, images_batch)\r\n                # backpropagation\r\n                zero_gradients(model)\r\n                loss, derivative_loss = loss_function(predictions_batch, targets_batch)\r\n                backward(model, derivative_loss)\r\n                # optimize the model's parameters\r\n                step!(optimizer)\r\n                # printing status\r\n                if batch % 100 == 0\r\n                    image_index = batch * train_data_loader.batch_size\r\n                    data_set_size = size(train_data_loader)\r\n                    println(\"Batch $batch, Image [$image_index/$data_set_size], Loss: $(round(loss, digits=5))\")\r\n                end\r\n                # adding the loss for measuring the average train loss\r\n                avg_train_loss += loss\r\n            end\r\n\r\n            avg_train_loss /= length(train_data_loader)\r\n            accuracy, avg_test_loss = test()\r\n            print(\"Results of epoch $epoch: Avg train loss: $(round(avg_train_loss, digits=5)), Avg test loss: $(round(avg_test_loss, digits=5)), Accuracy: $accuracy%, Time taken:\")\r\n\r\n        end\r\n\r\n    end\r\nend","category":"page"},{"location":"tutorials_and_examples/#Run-the-training-and-save-the-trained-model-afterwards","page":"Tutorials and Examples","title":"Run the training and save the trained model afterwards","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"When the file is run as the main script, we want to actually call the train() function and save the final model afterwards. We will be using the BSON.jl package for saving the model easily.","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"# when this file is run as the main script,\r\n# then train() is run and the final model will be saved using a package called BSON.jl\r\nif abspath(PROGRAM_FILE) == @__FILE__\r\n    train()\r\n    file_name = \"MNIST_with_LeNet5_model.bson\"\r\n    @save file_name model\r\n    println(\"Saved trained model as $file_name\")\r\nend","category":"page"},{"location":"tutorials_and_examples/#Running-the-file-with-multiple-threads","page":"Tutorials and Examples","title":"Running the file with multiple threads","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"It is heavily recommended to run this file, and any other files using GradValley, with multiple threads. Using multiple threads can make training much faster. To do this, use the -t option when running a julia script in terminal/PowerShell/command line/etc. If your CPU has 24 threads, for example, then run:","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"julia -t 24 ./MNIST_with_LeNet5.jl","category":"page"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"The specified number of threads should match the number of threads your CPU provides.","category":"page"},{"location":"tutorials_and_examples/#Results","page":"Tutorials and Examples","title":"Results","text":"","category":"section"},{"location":"tutorials_and_examples/","page":"Tutorials and Examples","title":"Tutorials and Examples","text":"These were my results after 5 training epochs: Results of epoch 5: Avg train loss: 0.00237, Avg test loss: 0.00283, Accuracy: 98.21%, Time taken: 13.416619 seconds (20.34 M allocations: 30.164 GiB, 5.86% gc time) On my Ryzen 9 5900X CPU (using all 24 threads, slightly overclocked), one epoch took around ~15 seconds (no compilation time), so the whole training (5 epochs) took around ~75 seconds (no compilation time).","category":"page"},{"location":"getting_started/#Getting-Started","page":"Getting Started","title":"Getting Started","text":"","category":"section"},{"location":"getting_started/#First-Impressions","page":"Getting Started","title":"First Impressions","text":"","category":"section"},{"location":"getting_started/","page":"Getting Started","title":"Getting Started","text":"This example shows the basic workflow on model building and how to use loss functions and optimizers to train the model:","category":"page"},{"location":"getting_started/","page":"Getting Started","title":"Getting Started","text":"using GradValley\r\nusing GradValley.Layers # The \"Layers\" module provides all the building blocks for creating a model.\r\nusing GradValley.Optimization # The \"Optimization\" module provides different loss functions and optimizers.\r\n\r\n# Definition of a LeNet-like model consisting of a feature extractor and a classifier\r\nfeature_extractor = SequentialContainer([ # a convolution layer with 1 in channel, 6 out channels, a 5*5 kernel and a relu activation\r\n                                         Conv(1, 6, (5, 5), activation_function=\"relu\"),\r\n                                         # an average pooling layer with a 2*2 filter (when not specified, stride is automatically set to kernel size)\r\n                                         AvgPool((2, 2)),\r\n                                         Conv(6, 16, (5, 5), activation_function=\"relu\"),\r\n                                         AvgPool((2, 2))])\r\nflatten = Reshape((256, ))\r\nclassifier = SequentialContainer([ # a fully connected layer (also known as dense or linear) with 256 in features, 120 out features and a relu activation\r\n                                  Fc(256, 120, activation_function=\"relu\"),\r\n                                  Fc(120, 84, activation_function=\"relu\"),\r\n                                  Fc(84, 10),\r\n                                  # a softmax activation layer, the softmax will be calculated along the second dimension (the features dimension)\r\n                                  Softmax(dim=2)])\r\n# The final model consists of three different submodules, \r\n# which shows that a SequentialContainer can contain not only layers, but also other SequentialContainers\r\nmodel = SequentialContainer([feature_extractor, flatten, classifier])\r\n                                  \r\n# feeding the network with some random data\r\ninput = rand(32, 1, 28, 28) # a batch of 32 images with one channel and a size of 28*28 pixels\r\nprediction = forward(model, input) # the forward function can work with a layer or a SequentialContainer\r\n\r\n# choosing an optimizer for training\r\nlearning_rate = 0.05\r\noptimizer = MSGD(model, learning_rate, momentum=0.5) # momentum stochastic gradient decent with a momentum of 0.5\r\n\r\n# generating some random data for a training step\r\ntarget = rand(size(prediction)...)\r\n# backpropagation\r\nzero_gradients(model)\r\nloss, derivative_loss = mse_loss(prediction, target) # mean squared error\r\nbackward(model, derivative_loss) # computing gradients\r\nstep!(optimizer) # making a optimization step with the calculated gradients and the optimizer","category":"page"},{"location":"getting_started/#First-Real-Project","page":"Getting Started","title":"First Real Project","text":"","category":"section"},{"location":"getting_started/","page":"Getting Started","title":"Getting Started","text":"Here are some suggestions to implement your first real project with GradValley.jl:","category":"page"},{"location":"getting_started/","page":"Getting Started","title":"Getting Started","text":"The \"Hello World\" of Deep Learning: Try the Tutorial on training A LeNet-like model for handwritten digit recognition.\nThe Reference: In the reference, you can find descriptions of all the layers, loss functions and optimizers.\nDownload a pre-trained model: More (Pre-Trained) Models will likely be deployed over time.\nLook at more Tutorials and Examples.","category":"page"},{"location":"(pre-trained)_models/#(Pre-Trained)-Models","page":"(Pre-Trained) Models","title":"(Pre-Trained) Models","text":"","category":"section"},{"location":"(pre-trained)_models/","page":"(Pre-Trained) Models","title":"(Pre-Trained) Models","text":"Unfortunately, no pre-trained models are currently available. Over time, however, models will be made available here.","category":"page"},{"location":"learning/#Learning","page":"Learning","title":"Learning","text":"","category":"section"},{"location":"installation/#Installation","page":"Installation","title":"Installation","text":"","category":"section"},{"location":"installation/","page":"Installation","title":"Installation","text":"The package can be installed with the Julia package manager. From the Julia REPL, type ] to enter the Pkg REPL mode and run:","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"pkg> add https://github.com/jonas208/GradValley.jl","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"Or, equivalently, via the Pkg API:","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"julia> import Pkg; Pkg.add(url=\"https://github.com/jonas208/GradValley.jl\")","category":"page"},{"location":"installation/#Used-Dependencies","page":"Installation","title":"Used Dependencies","text":"","category":"section"},{"location":"installation/","page":"Installation","title":"Installation","text":"GradValley.jl uses two packages which are inbuilt in the Julia programming language:","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"Random Numbers (no specific version)\nLinear Algebra (no specific version)","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"Besides that, GradValley.jl uses one external package:","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"LoopVectorization.jl (at least v0.12.146)","category":"page"},{"location":"installation/","page":"Installation","title":"Installation","text":"You can also look at the Project.toml file to find information about used dependencies and compatibility.","category":"page"},{"location":"installation/#All-used-dependencies-will-be-automatically-installed-due-installation-of-GradValley.jl.","page":"Installation","title":"All used dependencies will be automatically installed due installation of GradValley.jl.","text":"","category":"section"},{"location":"reference/#Reference","page":"Reference","title":"Reference","text":"","category":"section"},{"location":"reference/#GradValley.Layers","page":"Reference","title":"GradValley.Layers","text":"","category":"section"},{"location":"reference/#GradValley.Optimization","page":"Reference","title":"GradValley.Optimization","text":"","category":"section"},{"location":"reference/#GradValley.Functional","page":"Reference","title":"GradValley.Functional","text":"","category":"section"},{"location":"#Home","page":"Home","title":"Home","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Welcome to the GradValley.jl documentation!","category":"page"},{"location":"#ATTENTION,-IMPORTANT-INFORMATION:-THIS-DOCUMENTATION-IS-CURRENTLY-UNDER-CONSTRUCTION,-IT-IS-NOT-READY-FOR-USE-YET!!","page":"Home","title":"ATTENTION, IMPORTANT INFORMATION: THIS DOCUMENTATION IS CURRENTLY UNDER CONSTRUCTION, IT IS NOT READY FOR USE YET!!","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"GradValley.jl is a new lightweight module for deep learning written in 100% Julia. It offers a high level interface for model building and training. It is completely independent from other machine learning packages like Flux, Knet, NNlib or NNPACK. It is based on Julia's standard array type and needs no additional tensor type. GradValley.jl's \"backend\" is written \"human-friendly\". So if you're looking into how exactly such deep learning algorithms work, looking at the source code could also be a good learning resource. See Learning for further information. To get started, see Installation and Getting Started. After that, you could look at the Tutorials and Examples section.","category":"page"},{"location":"#About","page":"Home","title":"About","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"A while ago I started looking into machine learning. The topic fascinated me from the beginning, so I wanted to gain a deeper understanding of the way such models work. In my opinion, the best way to do this is to write your own small software package for machine learning and not just blindly use one of the big, established frameworks such as PyTorch or TensorFlow. The Julia programming language was my choice because of its popularity in academia and its very good performance compared to pure Python, which is after all very popular in the world of artificial intelligence. The product of this work is this module called GradValley.jl with which various current neural networks (e.g. CNNs) can be implemented easily and intuitively.","category":"page"},{"location":"#Array-structure-convention:","page":"Home","title":"Array structure convention:","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"The order used in GradValley for processing images (or similar data) is NCHW, where N is the batch dimension, C is the channel dimension, H is the vertical and W is the horizontal size of the image. In this regard, GradValley differs from some other deep learning packages in Julia and is similar to PyTorch instead. This makes the migration of pre-trained models from PyTorch or from the Python world in general to GradValley much easier.","category":"page"},{"location":"#Explanation-of-the-name-\"GradValley\":","page":"Home","title":"Explanation of the name \"GradValley\":","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"When optimizing the weights of a machine learning model, an attempt is always made to find the best possible error minimum. The derivatives, i.e. the gradients, of the error function in relation to the weights are required for this. So the goal is to find the \"valley\" of the error using the gradients (\"grad\" stands for gradient). That's why it's called GradValley.","category":"page"},{"location":"#Current-Limitations","page":"Home","title":"Current Limitations","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Due to the relatively early development status of this software, no GPU support is currently offered. GradValley.jl doesn't provide a real automatic differentiation (AD) engine like PyTorch does, for example. However, in the case of this software package, it is not really necessary to have real AD. Model building is mostly done with the SequentialContainer, this clearly defines the forward pass and thus the backward pass is also known to the software.","category":"page"}]
}
