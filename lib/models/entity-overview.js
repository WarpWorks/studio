const _ = require('lodash');
const Promise = require('bluebird');

function initResultObject(docEntity, doc) {
    return docEntity.getBasicProperties().reduce(
        (memo, basicProperty) => _.extend(memo, {
            [basicProperty.name]: doc[basicProperty.name]
        }),
        {
            type: doc.type,
            id: doc.id
        }
    );
}

function extractInfo(persistence, docEntity, recursiveCount, doc) {
    if (!doc) {
        return Promise.resolve(null);
    }

    return Promise.resolve()
        .then(() => {
            const resultObject = initResultObject(docEntity, doc);

            if (!recursiveCount) {
                return resultObject;
            }

            return Promise.reduce(
                docEntity.getRelationships(),
                (memo, relationship) => {
                    return relationship.getDocuments(persistence, doc)
                        .then((targetDocs) => {
                            return Promise.map(
                                    targetDocs,
                                    (targetDoc) => {
                                        return extractInfo(persistence, relationship.getTargetEntity(), recursiveCount - 1, targetDoc);
                                    }
                                )
                                .then((infos) => {
                                    return _.extend(memo, {
                                        [relationship.name]: infos
                                    });
                                });
                        });
                },
                resultObject
            );
        });
}

module.exports = (persistence, instance, overviewRelationship) => {
    // Recursion level:
    //  1: Image
    //  2: Map
    //  3: Target
    const extractParagraphInfo = extractInfo.bind(null, persistence, overviewRelationship.getTargetEntity(), 3);

    return overviewRelationship.getDocuments(persistence, instance)
        .then((docs) => {
            return Promise.map(docs, extractParagraphInfo);
        });
};
