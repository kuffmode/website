---
kicker: Research interests
title: Systematic Perturbation as a Lens for Understanding Brain Function
---

"Principles of resiliency in brain networks" is my overarching theme. I realized that the human brain exhibits remarkable resilience against perturbations ranging from focal strokes to distributed degeneration with surprising preservation of function. That said, this resilience presents an interesting dual paradox. Evolutionarily, it is protective, but clinically, it is a double-edged sword that limits our ability to intervene in disease. I think we currently lack a principled understanding of how the brain responds to perturbations and without a mechanistic model of brain resiliency, the downstream consequences of interventions remain unpredictable. More troublingly, it could be that resiliency itself is a mechanism of pathology. Much like autoimmune disorders, the brain's localised attempts to rebalance a perturbed state may drive the system into globally maladaptive, pathological states. As you see below, we've been busy trying to understand the principles of resiliency in brain networks, and how they can be leveraged to predict the consequences of perturbations, and maybe one day when I'm long dead, to design better interventions.


## Teleological Understanding of the Human Brain

Why does the human brain look like the way it does? It is far from a collection of randomly connected nodes, with many complex network features such as modularity, smallworldness, ... A very prolific line of work has been studying these features to come up with hypotheses about this why question. For example, smallworldness implies a cost-benefit trade-off so maybe that's a factor. Complementary to this approach, some other works came up with optimization algorithms to see if the resulting network looks like the brain. For example, if you'd want to optimally balance the trade-off, would you end up with a brain-like connectivity pattern?

I'm interested in both, but lean towards the latter. I started looking into this issue during my PhD, when I realized our game theoretical approach has the authority to settle some debates there. Game theory is a normative modeling framework so it's built to answer these types of questions. Precisely, I went ahead to test the trade-off idea using two game theoretical works. The main question is simple but important: Is the brain wired to optimize communication efficiency given the cost of wiring?

In the first paper, I went ahead with the premise that the brain's structure supports optimal communication and wanted to see what optimal communication on top of that network looks like. In the second one, I went even deeper and asked how would the network look like if all nodes set to optimize their communication? Together, we found that the communication in brain networks is not optimal and the network structure itself is not optimal either. There are other factors (obviously) such as reliability of computation and perhaps even the evolutionary history, that makes brains not optimal in any single metric (or two in this case).

**Relevant works:**
- Fakhar, K & Astle, D. (2026). Embracing the sub-optimal organization of the human brain. *[In press in Trends in Cognitive Sciences]*
- Fakhar, K., Akarca, D., Luppi, A., Oldham, S., Hadaeghi, F., Vertes, P., Bullmore, E., Hilgetag, C., & Astle, D. (2025). Human cortical networks trade communication efficiency for computational reliability. (p. 2025.12.11.693716). bioRxiv. https://doi.org/10.64898/2025.12.11.693716
- Fakhar, K., Hadaeghi, F., Seguin, C., Dixit, S., Messé, A., Zamora-López, G., Misic, B., & Hilgetag, C. C. (2025). A general framework for characterizing optimal communication in brain networks. *eLife*, 13, RP101780. https://doi.org/10.7554/eLife.101780

## Causal Inference in Neuroscience

Causality weaves the fabric of modern science and, consequently, understanding how the brain works and fails requires causal inference, both among brain regions or between brain and behavior. During the past decade, neuroscience has enjoyed rapid technological advancement of tools needed to record and manipulate an ever-growing number of neural elements. Yet, the very logical foundations of how we characterize what caused what is as old as the early days of neuroscience.

In my PhD project I undertook an ambitious project to first see what are the methodological issues that the field never really ended up looking at, and then come up with a better framework. The framework I settled on is called multi-perturbation Shapley value analysis or MSA for short. It builds upon a simple, yet rigorous and axiomatic concept: fairness.

Intuitively, one can see an effect (let's say some cognitive function) as a product of a complex web of contributing causes (e.g., brain regions). Each region can contribute its own way, just as how different people with widely different experties work together to build a house or an orchestra coordinating to perfect a piece. But eventually, we should be able to compensate them for their contribution, and we should have a fair system for this compensation so that every player (person or brain region) gets what it deserves.

You see, this is very intuitive but how exactly should we define fairness here? Game theory does that for us. A whole body of research spanning from 1950s tried and eventually they found a mathematically sound way of doing so, giving us a unique division of return among the players, meaning that there's no other way if you want everyone to get exactly what they deserve.

In a couple of papers using in-silico models (from simple networks of 19 neurons to LLMs) I then show where the conventional conceptual framework for causal inference falls apart and how MSA gives us a better picture of who's doing what in the system. With my friend Shrey Dixit, we also made a fast and general-purpose Python package for it. He then went even further and made a software specific for lesion symptom mapping.

**Relevant works:**
- Fakhar, K., & Hilgetag, C. C. (2022). Systematic perturbation of an artificial neural network: A step towards quantifying causal contributions in the brain. *PLoS Comput. Biol.*, 18(6), e1010250. https://doi.org/10.1371/journal.pcbi.1010250
- Dixit, S., Fakhar, K., Hadaeghi, F., Mineault, P., Kording, K. P., & Hilgetag, C. C. (2025). Who Does What in Deep Learning? Multidimensional Game-Theoretic Attribution of Function of Neural Units (arXiv:2506.19732). arXiv. https://doi.org/10.48550/arXiv.2506.19732
- Fakhar, K., Dixit, S. (2021). MSA: A compact Python package for Multiperturbation Shapley value Analysis. https://github.com/kuffmode/msa
- Fakhar, K., Dixit, S., Hadaeghi, F., Kording, K. P., & Hilgetag, C. C. (2024). Downstream network transformations dissociate neural activity from causal functional contributions. *Sci. Rep.*, 14(1), 2103. https://doi.org/10.1038/s41598-024-52423-7

## Structural Backbone of Computation in the Brain

What's so special about brain networks, if anything at all? There's this intuitive feeling that, since they keep the animal (and us) survive then what you see in them might be also useful for AI models. I have an interest in developing brain-inspired AI models but mainly to understand brains as opposed to improve AI.

One feature that we found very interesting but neglected (mainly because of methodological limitations) is reciprocity in brain networks. There are mixed results about how much reciprocal connectivity is in the brain, mainly because it's very difficult to measure them but there are logical deductions. For example there shouldn't be strong loops by which information returns to a neural unit immediately, which seems to be the case in the brain too. The reasons are, neurons have refractory periods so it'll simply be a waste of spike if what goes around comes around right after it left. Also, it means not much computation happened to it either, as opposed to long loops where information goes around and comes back after many steps of transformation.

So, even though neuroimaging methods don't help here, we expect this to be the case and we can simply show it using neural networks. This is what we did in two papers, one to come up with an algorithm that modulates reciprocity without messing with other features too much, and the other by checking how it impacts computation. Bottom-line is: Reciprocity (or strong-loops) are bad, tada!

**Relevant works:**
- Hadaeghi, F., Fakhar, K., & Hilgetag, C. C. (2026). Controlling reciprocity in binary and weighted networks: A novel density-conserving approach. *Chaos: An Interdisciplinary Journal of Nonlinear Science*, 36(2), 023116. https://doi.org/10.1063/5.0304136
- Hadaeghi, F., Fakhar, K., Khajehnejad, M., & Hilgetag, C. (2025). A Computational Perspective on the No-Strong-Loops Principle in Brain Networks (p. 2025.09.24.678310). bioRxiv. https://doi.org/10.1101/2025.09.24.678310